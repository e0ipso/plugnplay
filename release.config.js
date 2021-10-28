module.exports = {
  branches: ['master'],
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      { changelogFile: 'website/src/pages/changelog.md' },
    ],
    ['@semantic-release/npm', { tarballDir: 'release' }],
    ['@semantic-release/github', { assets: 'release/*.tgz' }],
    [
      '@semantic-release/git',
      {
        assets: ['website/src/pages/changelog.md'],
      },
    ],
  ],
};
