<!-- Source: https://github.com/nayafia/contributing-template/blob/master/CONTRIBUTING-template.md -->

# Contributing Guide

Thank you for considering working on Redux Undo! Open-source contributions keep this project alive and up-to-date. Only _you_ can contribute code to this project :wink:

Of course, we must lay down rules keep things in order.

We ask that you treat everyone with respect in your interactions on Github and other platforms redux-undo uses to continue development. You can read our [Code of Conduct](./docs/main/code-of-conduct.md), but paraphrased it reads "please be a nice person!"

## Scope of this project

As explained in the README, this library adds undo/redo functionality. However, it is not meant to be an all-in-one solution to your application plus a plugin for your jetpack and bluetooth toaster. If you have an idea, _please_ by all means submit an issue. But understand where we are coming from if we deem it too niche to include as a core feature. Though depending on the situation, we might be able to add it as an example in the docs.

## Ways to contribute

There are many ways to contribute: improving the documentation, submitting bug reports and feature requests, or writing code which can be incorporated into Redux Undo itself.

If you have never contributed before, check out some of the issues labeled `"good first issue"`. For more experienced developers, `"help wanted"` will pull up issues that are more involved.

For simple typos in the docs or similar problems, you can fork the project in the top right, make your changes on your copy, and create a pull request when you are done. Make sure to describe your PR as a doc change.

For more substantial changes, please check if there is an issue or PR that is already discussing the problem. Ask your questions there first. You can always create another issue if it turns out your problem is distinct.

If there is not an issue/PR, open an issue in the issue tracker to describe the problem and any potential solutions. We want to have a conversation so that you do not put in a lot of work only to have your idea turned down since it does not fit within our goals of the project.

## Making changes and creating a PR

If you are new to this sort of thing, check out this [free video course](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github) by Kent C. Dodds about how to contribute to an open source project. It walks you through the basics of using git and GitHub to contribute to an open source project.

Once you have a good understanding of git and GitHub, do the following.

- Fork the project and create a new branch of `master` with the name `pr/FEATURE` with "FEATURE" being a descriptive name of the changes you are making.
- Run `$ npm install` This will install dependencies and also run the linter, test suite, and build the project to make sure everything works okay.
- Assuming there are no problems, start making changes! Feel free to ask questions in the issue you created if you do not know how to approach a tricky nuance.
- Your commit messages should be descriptive of the changes made and reference any relevent issues: `"Fix minor Typescript errors, closes #200"`.
- Make sure to add tests for any substantial additions and that all the code follows the code styles (`$ npm run lint`).
- Once all the changes are in place, run `git fetch` and [rebase](https://git-scm.com/book/en/v2/Git-Branching-Rebasing) onto `master` to maintain a simple history for everyone. `$ git rebase upstream/master pr/FEATURE`
  - **Note**: You are not rebasing on `origin/master` since that is just the master of _your_ fork, which will also be outdated. You might need to add the original project as a [remote](https://git-scm.com/docs/git-remote#Documentation/git-remote.txt-emaddem).
- Open a PR with your changes and wait for a response. You might have to make a few adjustments or rebase again before it is finally merged.
- Watch as a project collaborator merges your branch and celebrate! You have contributed to open source!
- If you have any questions along the way, you can always ask them in the original issue to ask for guidance.

## Resources

If you need help using the library, read through the [documentation](https://redux-undo.js.org/), check out some of the [examples](/examples), or discuss your problem in [gitter](https://gitter.im/omnidan/redux-undo). Please reserve the issue tracker for bugs and features.
