const scriptInfo = {
    name: 'changes',
    desc: 'Allow users to see git changes from IRC',
    createdBy: 'IronY',
};

const {gitlogPromise} = require('gitlog');
const helpers = require('../../helpers');

// Review the local git change log ( Last 5 commits )
// Commands: changes
module.exports = app => {
    const changesHandler = async (to, from) => {
        try {
            const commits = await gitlogPromise(app.Config.gitLog);
            app.say(to, `I have messaged you the change log ${from}, you can view the last commit at ${app.Config.project.repository.url}/commit/${commits[0].abbrevHash}`);
            app.say(from, helpers.TitleLine(`${app._ircClient.nick} Change log, last ${app._ircClient.nick} changes:`));
            app.say(from, helpers.RedSlashes('Hash / Author / Subject / Date'));

            // List the commits
            commits.forEach(commit => app.say(from, helpers.RedSlashes(`${commit.abbrevHash} / ${commit.authorName} / ${commit.subject} / ${commit.authorDateRel}`)));
            // Last commit link
            if (commits && commits[0]) {
                app.say(from, `Last Commit: ${app.Config.project.repository.url}/commit/${commits[0].abbrevHash}`);
            }
        } catch (err) {
            logger.error('Something went wrong fetching gitlog in changes command', {
                message: err.message || '',
                stack: err.stack || '',
            });
            app.say(to, 'Something has gone wrong retrieving the change log');
        }
    };

    app.Commands.set('changes', {
        desc: 'Review the bots change log',
        access: app.Config.accessLevels.guest,
        call: changesHandler,
    });

    // Return the script info
    return scriptInfo;
};
