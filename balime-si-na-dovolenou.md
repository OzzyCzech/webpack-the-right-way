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

Jdeme na věc. Budeme potřebovat [webpack](https://webpack.js.org/) a celou řadu loaderů a pluginů, [babal](https://babeljs.io/),
[postcss](http://postcss.org/), [cssnext](http://cssnext.io/) a [webpack-dev-server](https://webpack.js.org/configuration/dev-server/). 
Začneme instalací potřebných balíčků:

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

A jdeme nastavit [module](https://webpack.js.org/configuration/module/):



Tak a jdeme se ponořit do konfigurace Webpacku.

### Balíme si zavazadlo

Nakonfigurovat Webpack tak, aby vyhovoval požadavků, které jsme si stanovili na začátku, není úplně triviální. 
Jdeme se tím společně prokousat!

Začneme vytvořením souboru `webpack.config.babel.js` - všimněte si přílepku `*.babel.js` tím zajistíme,
aby [Babal](https://babeljs.io/) náš konfigurační soubor za letu přeložil do *ECMAScript 5* a my budeme moci používat 
pro konfiguraci moderní *ECMAScript 6 syntax*.

Úvodem konfiguračního souboru naimportujeme potřebné knihovny. Bude se jednat o [Path](https://nodejs.org/api/path.html) 
z Nodejs, [Webpack](https://github.com/webpack/webpack), [CompressionPlugin](https://github.com/webpack-contrib/compression-webpack-plugin) 
pro gzip kompresi, [HtmlWebpackPlugin](https://github.com/jantimon/html-webpack-plugin) pro generování vstupního `index.html` a
[ExtractTextPlugin](https://github.com/webpack-contrib/extract-text-webpack-plugin), který nám pomůže uložit výsledky do souborů.

```javascript
import path from  'path';
import webpack from 'webpack';
import CompressionPlugin from 'compression-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
```

Dále si definujeme dvě konstanty (isDev a isHot), které nám pomohou určit kontext prostředí:

```javascript
const isDev = !Boolean(process.env.NODE_ENV === 'production');
const isHot = path.basename(require.main.filename) === 'webpack-dev-server.js';
```

A jdeme konfigurovat Webpack. To bude spočívat v postupném rozšiřování konstanty `app` o další a další parametry:       

```javascript
const app = {};
module.exports = [app];
```

Nastavíme si [context](https://webpack.js.org/configuration/entry-context/#context) a [entry](https://webpack.js.org/configuration/entry-context/#entry).

```javascript
const app = {
  context: path.resolve('.'),
  entry: { 
    app: './src/app.js',
    // backend: './src/admin.js'
    // main: './src/css/main.css'
  },
}
```

Vstupním bodem naší aplikace bude soubor `./src/app.js`. Těchto bodů může být definováno víc, 
klíčem se pak definuje chunk `[name]`. Toto `[name]` následně použíjeme při [definování názvů souborů](https://survivejs.com/webpack/optimizing/adding-hashes-to-filenames/#placeholders) na výstupu:

```javascript
const app = {
  // ... 
  output: {
   path: path.resolve(__dirname, './public/'),
   pathinfo: isDev, // užitečný pomocník, který přidá do výsledného souboru cestu ke zdrojovému souboru   
   publicPath: isDev && isHot ? 'http://localhost:5000/' : '/',
   filename: isDev ? 'js/[name].js' : 'js/[name].[chunkhash].js',
   chunkFilename: isDev ? 'js/[name].js' : 'js/[name].[chunkhash].js'
  },
}
```

Všimněte si, že `filename` a `chunkFilename` se pro produkční a vývojové prostředí různí. Řetězec `[chunkhash]` bude 
Webpackem nahrazen za **jedinečný hash odpovídající sestavení dané části**. Díky tomu bude zajištěno efektivní cachován v prohlížeči.
Stejně tak bude různá `publicPath`, pokud bude Webpack spuštěn pomocí [dev serveru](https://webpack.js.org/configuration/dev-server/).
Tak si jej rovnou nastavíme: 
    
```javascript
const app = {
  // ....
  devServer: {
    contentBase: [path.join(__dirname, 'public')],
    compress: true,
    host: 'localhost', // 0.0.0.0 || 127.0.0.1 || localhost || example.dev
    port: 5000,
    noInfo: true,
    overlay: true, // zobrazeni chyb
  }
}
```

Dále se hodí nastavit [devtool](https://webpack.js.org/configuration/devtool/). Ve vývojovém prostředí chceme co nejvyšší výkon, proto zvolíme `cheap-module-eval-source-map`. 
Nastavíme [performance](https://webpack.js.org/configuration/performance/) tak, aby nás Webpack pouze varoval, že překračujeme doporučené limity.
A upravíme si pomocí [stats](https://webpack.js.org/configuration/stats/), jaké informace nám bude Webpack vypisovat.

```javascript
const app = {
  // ....
  devtool: isDev ? 'cheap-module-eval-source-map' : false,
  performance: {hints: isDev ? false : "warning"},
  stats: isDev ? 'verbose' : 'minimal',  
}
```
Prostřednictvím [resolve](https://webpack.js.org/configuration/resolve/) sdělíme Webpacku, ve kterých složkách má hledat importované soubory: 

```javascript
const app = {
  // ....
  resolve: {
      modules: [path.resolve(__dirname, 'src'), 'node_modules']
  }
}
```

Nastavíme [module](https://webpack.js.org/configuration/module/) loadery pro JS, CSS, HTML a další statické soubory:

```javascript
const app = {
  // ....
  module: {
    rules: [
      
      // Javascript  loader
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {loader: 'babel-loader'},
      },
      
      // CSS loader
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: ['css-loader', 'postcss-loader']
        })
      },
      
      // Angular HTML template loader
      {
        test: /\.html$/,
        use: {
          loader: 'file-loader',
          options: {name: 'partials/[name].[hash:8].[ext]'}
        }
      },
      
      // images & fonts loader 
      {
        test: /\.(jpe?g|png|gif|webp|eot|ttf|woff|woff2|svg|)$/i,
        use: [
          {loader: 'url-loader', options: {limit: 1000, name: 'assets/[name].[hash].[ext]'}}
        ]
      }
    ]
  }
}
```

Za povšimnutí stojí nastavení parametru `name` u `file-loaderu`, který zpracovává HTML šablon Angularu a stejný parametr 
pro `url-loaderu`, zpracovávající statické soubory. Abychom se vyhnuli případným konfliktům v názvech souboru 
(stejně pojmenované šablony nebo obrázky) přidáme k názvům souboru `[hash]`. 

Pokud se chcete do konfigurace Webpack ponořit hlouběji,
doporučuji přečíst knihu [Survive Webpack](https://survivejs.com/webpack/introduction/). 

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
