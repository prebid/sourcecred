const axios = require('axios');

(async () => {
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.GITHUB_PR_NUMBER;
  const token = process.env.GITHUB_TOKEN;

  if (!repo || !prNumber || !token) {
    console.error('Missing required environment variables.');
    process.exit(1);
  }

  const [owner, repoName] = repo.split('/');
  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/files`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const files = response.data.map(file => file.filename);
    console.log('Changed files:', files);
  } catch (error) {
    console.error('Error fetching changed files:', error.message);
    process.exit(1);
  }
})();
