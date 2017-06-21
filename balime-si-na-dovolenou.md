# Webpack: Balíme si na dovolenou v produkci

V tomto článku bych se rád podíval hlouběji na použití Webpack v produkční prostředí. 
   
### Předcestovní příprava

V produkčním prostředí potřebujeme neprůstřelné verzování všech statických souborů. Abychom nemuseli řešit,
že nějaký prohlížeč návštěvníka webu nestáhl poslední verzi Javascript kód a jeho aplikace se z těchto důvodů chová podivně.
Totéž platí pro CSS soubory, které bychom rádi měli samostatně ve statickém souboru. Zrychlí se tím jeho zpracování 
a navíc statický soubor si bude prohlížeč schopen uložit do lokální cache.

Javascript třetích stran, jako jsou knihovny a frameworky, obvykle neměníme tak často, narozdíl od kódu naší aplikace. 
Bude lepší tento kód vyčlenit do samostatného souboru. Navíc tento kód bývá rozsáhlý - klidně několik megabajtů 
Javascriptu - je zbytečné, aby jej návštěvník stahoval s každou drobnou změnou aplikace znovu.

Javascript a CSS budeme samozřejmě servírovat minifikovaný. Statické soubory jako obrázky, fonty a podobně opatříme hash,
abychom byly schopni zajistit jejich správné vydávání.       

Protože máme svůj server rádi, ušetříme mu ještě jednu starost. Statický obsah, u kterého to má smysl, proženeme při 
sestavování aplikace gzip kompresí a uložíme do samostatných souborů. Server tak bude moci rovnou vracet 
připravené soubory a nebude se zdržovat s jejich kompresí. 

### Úrazové pojištění

Pro správu balíčků využijeme [Yarn](https://yarnpkg.com/lang/en/) a začneme jeho nastavením. Abychom se na serveru vyhnuli 
zbytečnému stahování npm balíčku, zprovozníme si lokální [Offline mirror](https://yarnpkg.com/blog/2016/11/24/offline-mirror/).
Vytvořte soubor `.yarnrc`, do kterého vložte následující kód: 
 
```
yarn-offline-mirror "./offline"
yarn-offline-mirror-pruning true
```

Adresář `offline` bude obsahovat lokální zálohu všech použitých balíčků. Složku můžeme sdílet mezi servery, nebo ji 
uchovávat a verzovat v git. Další výhodou je, že nebudeme tolik závislí na funkčnosti yarn registru.  

### Cestovní dokumenty

Jdeme na věc. Budeme potřebovat [webpack](https://webpack.js.org/) a celou řadu loaderů, [babal](https://babeljs.io/),
[postcss](http://postcss.org/), [cssnext](http://cssnext.io/) a [webpack-dev-server](https://webpack.js.org/configuration/dev-server/).

Začneme instalací závislostí balíčků:

```bash
yarn add babel-cli \
         babel-core  \
         babel-loader \
         babel-plugin-add-module-exports \
         babel-plugin-transform-runtime \
         babel-preset-env \
         babel-runtime \
         compression-webpack-plugin \
         css-loader \
         expose-loader \
         extract-text-webpack-plugin \
         file-loader \
         html-webpack-harddisk-plugin \
         html-webpack-plugin \
         postcss \
         postcss-cssnext \
         postcss-easy-import \
         postcss-import \
         postcss-loader \
         preload-webpack-plugin \
         raw-loader \
         style-loader \
         url-loader \
         webpack \
         webpack-bundle-analyzer \
         webpack-dev-server
```

Hotovo! Přidáme si do `package.json` následující skripty:
     
```json
 "scripts": {
    "start": "webpack-dev-server --progress --hot --inline --colors",
    "watch": "webpack --watch --progress --devtool cheap-module-eval-source-map",
    "build": "webpack --devtool source-map",
    "build:production": "NODE_ENV=production webpack",        
	},
```

Skripty se nám budou později hodit, abychom mohli pomoci `yarn run build` spustit build aplikace nebo nastartovat **webpack-dev-server**.

Než začneme s Webpackem nastavíme si ještě [babal](https://babeljs.io/). Vytvořte si soubor `.babelrc` s následujícím obsahem:

```json
{
  "presets": ["env"],
  "plugins": ["babel-plugin-add-module-exports", "transform-runtime"]
}
```

A ještě konfigurace [postcss](http://postcss.org/). Do souboru `postcss.config.js` vložte následující: 

```javascript
module.exports = {
	plugins: {
		'postcss-import': {},
		'postcss-cssnext': {
			browsers: ['last 2 versions', '> 5%'],
		},
		'postcss-clean' : {},
	},
};
```

Tak a jdeme se ponořit do konfigurace Webpacku.

### Balíme si zavazadlo

Webpack

Doporučuji prostudovat knihu [Survive Webpack](https://survivejs.com/webpack/introduction/) - konfigurace Webpacku nemusí být zrovna triviálné, 
pokud se do ní ponoříte hlouběji.
 
### Odletáme na dovolenou

Náš release skript bude velmi jednoduchý. Nejprve získáme poslední soubory:

```bash
git fetch origin && git reset --hard master
git clean -df -e offline # složku offline chceme zachovat, proto ji při úklidu přeskočíme
```

Sestavíme aplikaci a připravíme nové soubory:

```bash
yarn install --prefer-offline && yarn run 'build:production'
```

Na závěr přeneseme vytvořené data do složky `/var/www/web/public`:  

```bash
rsync -avh ./public /var/www/web --delete-after
```

Hotovo. Aplikace běží a my můžeme konečně na dovolenou.
