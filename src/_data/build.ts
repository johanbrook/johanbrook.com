export default {
  hash: Deno.env.get('GITHUB_SHA') || 'dev',
  date: new Date().toJSON(),
  env: Deno.env.get('ENV') || 'development',
};
