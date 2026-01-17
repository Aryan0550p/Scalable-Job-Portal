const { Client } = require('@elastic/elasticsearch');
const logger = require('./logger');

let esClient;

const connectElasticsearch = async () => {
  try {
    esClient = new Client({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    });

    const health = await esClient.cluster.health();
    logger.info('Elasticsearch cluster health:', health.status);

    // Create jobs index if it doesn't exist
    const indexExists = await esClient.indices.exists({
      index: process.env.ELASTICSEARCH_INDEX || 'jobs',
    });

    if (!indexExists) {
      await esClient.indices.create({
        index: process.env.ELASTICSEARCH_INDEX || 'jobs',
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                job_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop', 'snowball'],
                },
              },
            },
          },
          mappings: {
            properties: {
              title: { type: 'text', analyzer: 'job_analyzer' },
              description: { type: 'text', analyzer: 'job_analyzer' },
              company: { type: 'keyword' },
              location: { type: 'keyword' },
              salary_min: { type: 'integer' },
              salary_max: { type: 'integer' },
              job_type: { type: 'keyword' },
              experience_level: { type: 'keyword' },
              skills: { type: 'keyword' },
              posted_date: { type: 'date' },
              status: { type: 'keyword' },
            },
          },
        },
      });
      logger.info('Jobs index created');
    }

    return esClient;
  } catch (error) {
    logger.error('Elasticsearch connection failed:', error);
    throw error;
  }
};

const getElasticsearchClient = () => {
  if (!esClient) {
    throw new Error('Elasticsearch client is not initialized');
  }
  return esClient;
};

module.exports = {
  connectElasticsearch,
  getElasticsearchClient,
};
