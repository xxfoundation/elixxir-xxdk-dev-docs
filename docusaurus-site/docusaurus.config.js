// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Client API (xxDK)',
  tagline: 'The frontend of the CMix protocol',
  url: 'https://xxdk-dev.xx.network',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'xxnetwork', // Usually your GitHub org/user name.
  projectName: 'docusaurus', // Usually your repo name.

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/'
          // Please change this to your repo.
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
      },
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
      navbar: {
        title: 'Client API (xxDK)',
        logo: {
          alt: 'The xx network Logo',
          src: 'img/xx_network.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'overview',
            position: 'left',
            label: 'Docs',
          },
          {
            href: 'https://git.xx.network/elixxir/xxdk-dev-docs',
            label: 'GitLab',
            position: 'left',
          },
        ],
      },
      announcementBar: {
      id: 'announcement-bar',
      content:
        'We are currently updating these docs. Please <a target="_blank" rel="noopener noreferrer" href="https://discord.gg/Y8pCkbK">reach out on Discord</a> with any questions about using the xxDK.',
      backgroundColor: '#18191ade',
      textColor: '#fff',
      isCloseable: false,
    },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Community',
            items: [
              {
                label: 'Twitter',
                href: 'https://twitter.com/xx_network',
              },
              {
                label: 'Discord',
                href: 'https://discord.gg/Y8pCkbK',
              },
              {
                label: 'Telegram',
                href: 'https://t.me/xxnetwork',
              },
              {
                label: 'YouTube',
                href: 'https://www.youtube.com/c/xxnetwork',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitLab',
                href: 'https://git.xx.network/elixxir/xxdk-dev-docs',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} xx network. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['swift'],
      },
    }),
};
module.exports = config;
