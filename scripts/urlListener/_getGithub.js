const rp = require('request-promise-native');
const logger = require('../../lib/logger');

// Get GitHub Information
module.exports = async (user, repo, results) => {
    try {
        // Get request
        const data = await rp({
            uri: `https://api.github.com/repos/${user}/${repo}`,
            headers: {
                'user-agent': 'MrNodeBot',
            },
            json: true,
        });

        // No data, bail
        if (!data) return results;

        // Return appended results
        return Object.assign(results, {
            gitHub: {
                name: data.name,
                owner: data.owner.login,
                desc: data.description,
                isFork: data.fork,
                lastPush: data.pushed_at,
                stars: data.stargazers_count,
                watchers: data.watchers_count,
                language: data.language,
                forks: data.forks_count,
                issues: data.open_issues_count,
                fullName: data.full_name,
            },
        });
    } catch (err) {
        logger.warn('Error in getGitHub link function', {
            message: err.message || '',
            stack: err.stack || '',
        });
        return results;
    }
};
