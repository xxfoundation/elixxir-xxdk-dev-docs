# xxDK Dev Docs

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

## Prerequisites
- [Node.js](https://nodejs.org/en/download/) version >= 14 or above OR [Yarn](https://yarnpkg.com/en/) version >= 1.5

## Project Structure
/blog/ - Contains the blog Markdown files. More details can be found in the [blog guide](https://docusaurus.io/docs/blog)

/docs/ - Contains the Markdown files for the docs. Customize the order of the docs sidebar in sidebars.js. More details can be found in the [docs guide](https://docusaurus.io/docs/docs-markdown-features)

/src/ - Non-documentation files like pages or custom React components. You don't have to strictly put your non-documentation files in here but putting them under a centralized directory makes it easier to specify in case you need to do some sort of linting/processing

/src/pages - Any files within this directory will be converted into a website page. More details can be found in the [pages guide](https://docusaurus.io/docs/creating-pages)

/static/ - Static directory. Any contents inside here will be copied into the root of the final build directory

/docusaurus.config.js - A config file containing the site configuration. This is the equivalent of siteConfig.js in Docusaurus v1

/package.json - A Docusaurus website is a React app. You can install and use any npm packages you like in them

/sidebar.js - Used by the documentation to specify the order of documents in the sidebar

## Installation
To install dependencies: 

```
$ npm install 
// or `yarn install`
```

## Local Development

```
cd my-website
npm run start 
# or `yarn run start`
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```
$ npm run build
# or `yarn run build`
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

## Updating Docusaurus

See [Updating your Docusaurus version](https://docusaurus.io/docs/installation#updating-your-docusaurus-version)