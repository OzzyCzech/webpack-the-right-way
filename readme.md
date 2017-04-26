# Webpack 2.x The Right way

Nastavit Webpack pro vývojové a produkční prostředí není žádný legrace. Zejména pokud nemůžete začít na zelené louce.

* **Long term caching pro externí knihovny** jako jsou například jquery, angular, react 
* Neprůstřelné verzování vygenerovaných kódu na produkčním prostředí.
* Integrace starých jQuery pluginů.
* Integrace do stávající aplikace (postavena nad PHP / Nette / Latte tamplates).
* Automatické generování vstupního souboru aplikace (index.html).
* Jasné rozdělené development a produkčního prostředí.
* Reporting pomocí [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)
* [Post CSS + CSS Next](https://github.com/OzzyCzech/webpack2-postcss-cssnext)

### Instalace

```
yarn install
yarn run build         # build only
yarn run watch         # dev + watch
yarn run build:stable  # stable
yarn run report        # run bundle analyzer
```

### Resources
* [Survive JS Webpack](https://survivejs.com/webpack/introduction/) 
* https://gist.github.com/addyosmani/58e00d3eb2bd6e1da316ed7c1a8e83d0