import { GitContributors } from "D:/code/Zhaha/blog/node_modules/.pnpm/@vuepress+plugin-git@2.0.0-_2baa541ea0b61ad5745596ea4b885359/node_modules/@vuepress/plugin-git/lib/client/components/GitContributors.js";
import { GitChangelog } from "D:/code/Zhaha/blog/node_modules/.pnpm/@vuepress+plugin-git@2.0.0-_2baa541ea0b61ad5745596ea4b885359/node_modules/@vuepress/plugin-git/lib/client/components/GitChangelog.js";

export default {
  enhance: ({ app }) => {
    app.component("GitContributors", GitContributors);
    app.component("GitChangelog", GitChangelog);
  },
};
