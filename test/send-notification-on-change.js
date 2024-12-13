const fs = require('fs');
const path = require('path');
const axios = require('axios');
const nodemailer = require('nodemailer');

(async () => {
  const configFilePath = path.join(__dirname, 'test/codepath-notification');
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.GITHUB_PR_NUMBER;
  const token = process.env.GITHUB_TOKEN;

  if (!repo || !prNumber || !token) {
    console.error('Missing required environment variables.');
    process.exit(1);
  }

  try {
    // Read and process the configuration file
    const configFileContent = fs.readFileSync(configFilePath, 'utf-8');
    const configRules = configFileContent
      .split('\n')
      .filter(line => line.trim() !== '') // Filter out empty lines
      .map(line => {
        const [regex, email] = line.split(':').map(part => part.trim());
        return { regex: new RegExp(regex), email };
      });

    console.log('Loaded configuration rules:', configRules);

    // Fetch changed files
    const [owner, repoName] = repo.split('/');
    const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/files`;

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const changedFiles = response.data.map(file => file.filename);
    console.log('Changed files:', changedFiles);

    // Group matched files by email address
    const matchesByEmail = {};
    changedFiles.forEach(file => {
      configRules.forEach(rule => {
        if (rule.regex.test(file)) {
          if (!matchesByEmail[rule.email]) {
            matchesByEmail[rule.email] = [];
          }
          matchesByEmail[rule.email].push(file);
        }
      });
    });

    console.log('Grouped matches by email:', matchesByEmail);

    // Configure Nodemailer
//    const transporter = nodemailer.createTransport({
//      service: 'Gmail',
//      auth: {
//        user: process.env.EMAIL_USER,
//        pass: process.env.EMAIL_PASS,
//      },
//    });

    // Send one email per recipient
    for (const [email, files] of Object.entries(matchesByEmail)) {
      const emailBody = `
        <h1>Files Changed in PR #${prNumber}</h1>
        <ul>
          ${files.map(file => `<li>${file}</li>`).join('')}
        </ul>
      `;

      try {
 //       await transporter.sendMail({
 //         from: `"GitHub Bot" <${process.env.EMAIL_USER}>`,
 //         to: email,
 //         subject: `Files Changed in PR #${prNumber}`,
 //         html: emailBody,
 //       });

        console.log(`Email sent successfully to ${email}`);
        console.log(`${emailBody}`);
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
