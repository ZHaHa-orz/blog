import { CodeTabs } from "D:/code/Zhaha/blog/node_modules/.pnpm/@vuepress+plugin-markdown-t_4e486e90e1b563aa4cd7d1fd39de4288/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/CodeTabs.js";
import { Tabs } from "D:/code/Zhaha/blog/node_modules/.pnpm/@vuepress+plugin-markdown-t_4e486e90e1b563aa4cd7d1fd39de4288/node_modules/@vuepress/plugin-markdown-tab/lib/client/components/Tabs.js";
import "D:/code/Zhaha/blog/node_modules/.pnpm/@vuepress+plugin-markdown-t_4e486e90e1b563aa4cd7d1fd39de4288/node_modules/@vuepress/plugin-markdown-tab/lib/client/styles/vars.css";

export default {
  enhance: ({ app }) => {
    app.component("CodeTabs", CodeTabs);
    app.component("Tabs", Tabs);
  },
};
