const { getElasticsearchClient } = require('../config/elasticsearch');
const { pool } = require('../config/database');
const logger = require('../config/logger');

class SearchService {
  async indexJob(job) {
    try {
      const esClient = getElasticsearchClient();
      const index = process.env.ELASTICSEARCH_INDEX || 'jobs';

      await esClient.index({
        index,
        id: job.id.toString(),
        document: {
          title: job.title,
          description: job.description,
          company: job.company,
          location: job.location,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          job_type: job.job_type,
          experience_level: job.experience_level,
          skills: job.skills,
          posted_date: job.posted_date,
          status: job.status,
        },
      });

      logger.info(`Job indexed in Elasticsearch: ${job.id}`);
    } catch (error) {
      logger.error('Error indexing job:', error);
      throw error;
    }
  }

  async deleteJobFromIndex(jobId) {
    try {
      const esClient = getElasticsearchClient();
      const index = process.env.ELASTICSEARCH_INDEX || 'jobs';

      await esClient.delete({
        index,
        id: jobId.toString(),
      });

      logger.info(`Job removed from Elasticsearch: ${jobId}`);
    } catch (error) {
      if (error.meta?.statusCode !== 404) {
        logger.error('Error deleting job from index:', error);
      }
    }
  }

  async searchJobs(query, filters = {}, page = 1, limit = 20) {
    try {
      const esClient = getElasticsearchClient();
      const index = process.env.ELASTICSEARCH_INDEX || 'jobs';

      const from = (page - 1) * limit;

      // Build Elasticsearch query
      const must = [];
      const filter = [{ term: { status: 'active' } }];

      // Full-text search
      if (query) {
        must.push({
          multi_match: {
            query,
            fields: ['title^3', 'description^2', 'skills^2', 'company'],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        });
      }

      // Filters
      if (filters.location) {
        filter.push({
          match: {
            location: {
              query: filters.location,
              fuzziness: 'AUTO',
            },
          },
        });
      }

      if (filters.job_type) {
        filter.push({ term: { job_type: filters.job_type } });
      }

      if (filters.experience_level) {
        filter.push({ term: { experience_level: filters.experience_level } });
      }

      if (filters.salary_min) {
        filter.push({
          range: {
            salary_max: { gte: parseInt(filters.salary_min) },
          },
        });
      }

      if (filters.skills && filters.skills.length > 0) {
        filter.push({
          terms: { skills: filters.skills },
        });
      }

      const searchBody = {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter,
          },
        },
        from,
        size: limit,
        sort: [{ posted_date: { order: 'desc' } }],
        highlight: {
          fields: {
            title: {},
            description: {},
          },
        },
      };

      const result = await esClient.search({
        index,
        body: searchBody,
      });

      // Get full job details from PostgreSQL
      const jobIds = result.hits.hits.map((hit) => hit._id);

      if (jobIds.length === 0) {
        return {
          jobs: [],
          total: 0,
          page,
          totalPages: 0,
        };
      }

      const jobsResult = await pool.query(
        `SELECT j.*, u.full_name as recruiter_name, u.company_name
         FROM jobs j
         JOIN users u ON j.recruiter_id = u.id
         WHERE j.id = ANY($1)
         ORDER BY j.posted_date DESC`,
        [jobIds]
      );

      return {
        jobs: jobsResult.rows,
        total: result.hits.total.value,
        page,
        totalPages: Math.ceil(result.hits.total.value / limit),
        highlights: result.hits.hits.reduce((acc, hit) => {
          acc[hit._id] = hit.highlight;
          return acc;
        }, {}),
      };
    } catch (error) {
      logger.error('Search error:', error);
      throw error;
    }
  }

  async suggestJobs(query) {
    try {
      const esClient = getElasticsearchClient();
      const index = process.env.ELASTICSEARCH_INDEX || 'jobs';

      const result = await esClient.search({
        index,
        body: {
          suggest: {
            job_suggest: {
              prefix: query,
              completion: {
                field: 'title',
                size: 5,
                skip_duplicates: true,
              },
            },
          },
        },
      });

      return result.suggest.job_suggest[0].options.map((option) => option.text);
    } catch (error) {
      logger.error('Suggest error:', error);
      return [];
    }
  }

  async bulkIndexJobs() {
    try {
      const esClient = getElasticsearchClient();
      const index = process.env.ELASTICSEARCH_INDEX || 'jobs';

      // Get all active jobs from database
      const result = await pool.query(
        'SELECT * FROM jobs WHERE status = $1',
        ['active']
      );

      if (result.rows.length === 0) {
        logger.info('No jobs to index');
        return;
      }

      // Prepare bulk operations
      const operations = result.rows.flatMap((job) => [
        { index: { _index: index, _id: job.id.toString() } },
        {
          title: job.title,
          description: job.description,
          company: job.company,
          location: job.location,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          job_type: job.job_type,
          experience_level: job.experience_level,
          skills: job.skills,
          posted_date: job.posted_date,
          status: job.status,
        },
      ]);

      const bulkResponse = await esClient.bulk({ operations });

      if (bulkResponse.errors) {
        logger.error('Bulk indexing had errors');
      } else {
        logger.info(`Successfully indexed ${result.rows.length} jobs`);
      }
    } catch (error) {
      logger.error('Bulk index error:', error);
      throw error;
    }
  }
}

module.exports = new SearchService();
