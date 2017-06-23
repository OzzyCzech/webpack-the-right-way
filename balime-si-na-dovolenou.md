# Webpack: Balíme si na dovolenou v produkci

V tomto článku bych se rád podíval hlouběji na použití Webpack v produkční prostředí. Prošel si jeho nastavení, 
hezky krok po kroku. Vysvětlil, co a jak udělat, aby naše produkční prostředí ve srovnání s vývojovým prostředím nestrádalo.
   
### Předcestovní příprava

V produkčním prostředí potřebujeme neprůstřelné verzování všech souborů. Abychom nemuseli řešit, 
že nějaký [prohlížeč návštěvníka webu](http://www.refreshyourcache.com/en/home/) si nestáhl naše poslední logo, 
nebo má stále starší Javascript kód a jeho aplikace se chová jaksi podivně. Stejné nepříjemnosti platí pro CSS soubory, 
které bychom rádi měli samostatně ve statickém souboru. Zrychlí se tím jeho vydávání ze serveru a prohlížeč si jej 
bude moci uložit do lokální cache.   

Javascript třetích stran, jako jsou **knihovny a frameworky**, obvykle neměníme tak často, narozdíl od kódu naší aplikace. 
Bude lepší tento kód **vyčlenit do samostatného souboru**. Navíc tento kód bývá rozsáhlý - klidně několik megabajtů 
Javascriptu - je proto zbytečné, aby jej návštěvník stahoval s každou drobnou změnou aplikace znovu.

Javascript i CSS budeme samozřejmě servírovat minifikovaný. Statické soubory jako obrázky, fonty budeme také verzovat, 
abychom zajistili jejich správné vydávání ze serveru. 

Protože máme svůj server rádi, ušetříme mu ještě jednu starost. Statický obsah, u kterého to má smysl, proženeme při 
sestavování aplikace **gzip kompresí** a uložíme do samostatných souborů. Server tak bude moci [rovnou vracet 
připravené soubory](http://nginx.org/en/docs/http/ngx_http_gzip_static_module.html) a nebude se zdržovat s jejich kompresí. 

### Úrazové pojištění

Pro správu balíčků využijeme [Yarn](https://yarnpkg.com/lang/en/) a začneme jeho nastavením. Abychom se na serveru vyhnuli 
zbytečnému stahování npm balíčku, zprovozníme si lokální [Offline mirror](https://yarnpkg.com/blog/2016/11/24/offline-mirror/).
Vytvořte soubor `.yarnrc`, do kterého vložte následující kód: 
 
```
yarn-offline-mirror "./offline"
yarn-offline-mirror-pruning true
```

Adresář `offline` pak bude obsahovat lokální zálohu všech použitých balíčků. Složku můžeme sdílet mezi servery, nebo ji 
uchovávat či verzovat v git. Další výhodou je, že už nebudeme tolik závislí na dostupnosti **yarn registru**.  

### Cestovní dokumenty

Jdeme na věc. Budeme potřebovat [webpack](https://webpack.js.org/) a celou řadu loaderů a pluginů,
[babal](https://babeljs.io/), [postcss](http://postcss.org/), [cssnext](http://cssnext.io/) a
[webpack-dev-server](https://webpack.js.org/configuration/dev-server/). Začneme instalací potřebných balíčků:

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

Hotovo! Do `package.json` si přidáme následující skripty:
     
```json
"scripts": {
  "server": "webpack-dev-server -d --progress --hot --inline --colors",
  "watch": "webpack -d --progress --watch",
  "build": "webpack -d",
  "build:production": "webpack"
},
```

Skripty se nám budou později hodit, abychom mohli pomoci `yarn run build` spustit build aplikace, 
nebo nastartovat **webpack-dev-server** pomocí příkazu `yarn run server`. Webpack budeme spouštět z řadou parametrů,
jejich význym najdete v [dokumentaci](https://webpack.js.org/api/cli/).   

Než začneme s Webpackem nastavíme si ještě [babal](https://babeljs.io/). Vytvořte si soubor `.babelrc` s následujícím obsahem:

```json
{
  "presets": ["env"],
  "plugins": ["babel-plugin-add-module-exports", "transform-runtime"]
}
```

A ještě přidejte konfiguraci [postcss](http://postcss.org/) do souboru `postcss.config.js`: 

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

Tak a jdeme se konečně ponořit do konfigurace Webpacku.

### Balíme si zavazadlo

Nakonfigurovat Webpack tak, aby vyhovoval požadavků, které jsme si stanovili na začátku, není úplně triviální.

Začneme vytvořením souboru `webpack.config.babel.js` - všimněte si přílepku `*.babel.js` tím zajistíme,
aby [Babal](https://babeljs.io/) náš konfigurační soubor za letu přeložil do *ECMAScript 5* a my budeme moci vesele
používat při konfiguraci novější *ECMAScript 6 syntax*.

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
const isHot = path.basename(require.main.filename) === 'webpack-dev-server.js';
const isDev = isHot || process.argv.indexOf('-d') !== -1;
```

Jdeme konfigurovat Webpack. Jednotlivá nastavení budeme postupně  přidaávat do konstanty `app`:       

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

Vstupním bodem naší aplikace bude soubor `./src/app.js`. Těchto bodů může být definováno víc, klíčem se pak definuje 
chunk `[name]`. Toto `[name]` následně použíjeme při [definování názvů souborů](https://webpack.js.org/configuration/output/#output-filename) na výstupu:

```javascript
const app = {
  // ... 
  output: {
   path: path.resolve(__dirname, './public/'),      
   publicPath: isDev && isHot ? 'http://localhost:5000/' : '/',
   filename: isDev ? 'js/[name].js' : 'js/[name].[chunkhash].js',
   chunkFilename: isDev ? 'js/[name].js' : 'js/[name].[chunkhash].js'
  },
}
```

Všimněte si, že `filename` a `chunkFilename` se pro produkční a vývojové prostředí různí. Řetězec `[chunkhash]` bude 
Webpackem nahrazen za **jedinečný hash odpovídající sestavení dané části**. Díky tomu bude zajištěno efektivní cachován v prohlížeči.
Stejně tak bude různá `publicPath`, pokud bude Webpack spuštěn pomocí [dev serveru](https://webpack.js.org/configuration/dev-server/).

Dev server si můžeme také rovnou nastavit: 
    
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
 
Nastavíme [performance](https://webpack.js.org/configuration/performance/) tak,
aby nás Webpack pouze varoval, že překračujeme doporučené limity. A upravíme si pomocí 
[stats](https://webpack.js.org/configuration/stats/), jaké informace nám bude Webpack vypisovat.

```javascript
const app = {
  // ....  
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
        // povšimněte si použití ExtractTextPluginu, budeme jej ještě nastavovat dále
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

Za povšimnutí stojí nastavení parametru `name` u `file-loaderu` pro HTML šablony Angularu a stejný parametr 
pro `url-loaderu`, zpracovávající statické soubory.

Abychom se vyhnuli případným konfliktům v názvech souboru (např. stejně pojmenované obrázky) přidáme k názvům souboru
`[hash]` a pomocí `[ext]` zachováme původní příponu zpracovávaného souboru.  

Na závěr konfigurace nám už jenom stačí nastavit [Webpack plugins](https://webpack.js.org/configuration/plugins/). 
Pro produkční a vývojové prostředí se bude sada pluginů lišit. To vyřešíme pomocí Javascriptu snadno: 


```javascript
const app = {
  //...
  plugins: [
    // ZDE vložíme všechny společné pluginy
  ].concat(
    // a přidáme k nim plugny pro ... 
    isDev ? [ /* vývojové prostředí */ ] : [ /* a popřápadě produkční prostředí */ ]
  )
}
```

Společné pluginy budou vypadat takto:

```javascript
const app = {
  //...
  plugins: [  		
    new HtmlWebpackPlugin({
          inject: 'head',
          filename: 'index.html',
          chunksSortMode: 'dependency',
          template: '!!raw-loader!./src/index.html'
        }
    ),
    // ...
```

Plugin [HtmlWebpackPlugin](https://github.com/jantimon/html-webpack-plugin) bude generovat `index.html`,
tedy vstupní bránu do naší aplikace. Vygenerovaný HTML soubor bude obsahovat odkazy na všechny vygenerované soubory.
Všimněte si nastavení `chunksSortMode: 'dependency'`, tímto parametrem určíme jak budou jednotlivé části sposkládány 
a seřazeny v HTML hlavičce vygenerovaného souboru. Jako předlohu použijeme soubor `src/index.html`.

```javascript
    // ...
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor', // zde definujeme [name]
      minChunks: ({resource}) => (
          resource &&
          resource.indexOf('node_modules') >= 0 &&
          resource.match(/\.js$/)
      )
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      minChunks: Infinity
    }),
    // ...
```

Plugin `webpack.optimize.CommonsChunkPlugin` použijeme hned dvakrát. Poprvé pomocí tohoto pluginu oddělíme 
všechny Javascripty importované z `node_modules` do souboru `vendor.*.js`. Podruhé přesuneme do samostatného souboru 
`manifest.*.js` kódy, které nám generuje Webpack. Kód generovaný Webpackem se totiž mění prakticky neustále a šel by 
proti naší snaze zlepšit a prodloužit cachování kódu, který se nemění tak často.     

S tímto pluginem se dá udělat řadu dalších kouzel o kterých se dočtete v Kapitole [Bundle Spliting](https://survivejs.com/webpack/building/bundle-splitting/)
v knize [Survive Webpack](https://survivejs.com/webpack/introduction/).

```javascript
    // ...
    new webpack.ProvidePlugin({
      '$': 'jquery',
      'jquery': 'jquery',
      'jQuery': 'jquery',
      'window.$': 'jquery',
      'window.jQuery': 'jquery' // jQuery pluginy no ... ¯\_(ツ)_/¯
    }),
    // ...
```

Plugin `webpack.ProvidePlugin` zařídí, abychom nemuseli sáhnout do starých kódu a všude přidávat import jQuery.
Pokud Webpack při zpracování narazí na jQuery, provede to automaticky za nás. Toto nastavení je rovněž volitelné,
pokud jQuery již nepoužíváte. 

```javascript
    // ...
    new ExtractTextPlugin({
          filename: isDev ? 'css/[name].css' : 'css/[name].[contenthash].css',
          disable: isHot,
          allChunks: true
        }
    ),
    // ...
```

Jak jsme již psal v úvodu, kód CSS budeme chtít oddělit do statického souboru. Tohle za nás zařídí plugin `ExtractTextPlugin`. 
Nastavení pluginu má jedno specifikum, tím je `[contenthash]` - chceme totiž, aby soubor měl jedinečné jméno, 
generované na základě jeho aktuálního obsahu.

```javascript
    // ...    
    new webpack.NoEmitOnErrorsPlugin()
  ].concat(isDev ? [/* ... */] : [/* ... */])
}
```

Posledním společným pluginem bude `webpack.NoEmitOnErrorsPlugin()`, který zamezí generování nových souborů,
pokud dojde k nějaké chybě. Další nastavení a pluginy se budou pluginy řídit aktuálním prostředím: 
 

```javascript
const app = {
  //...
  plugins: [ /* ... */].concat(
    isDev ? [
      new webpack.NamedModulesPlugin(),
    ] : [
      new webpack.HashedModuleIdsPlugin({hashFunction: 'sha256'}),
   
      // gzip results
      new CompressionPlugin({
        asset: '[path].gz[query]',
        algorithm: 'gzip',
        test: /\.(js|css|html)$/
      }),
   
      // minify js
       new webpack.optimize.UglifyJsPlugin({
        compress: {warnings: false},
        mangle: {
          except: ['$', 'jQuery'] // nepřejmenuj jQuery
        }
      }),
    ]
    )
}
```

Pluginy `webpack.NamedModulesPlugin` a `webpack.HashedModuleIdsPlugin` určují, jak si bude Webpack označovat při
skládání jednotlivé části kódu.

Na začátku jsme si řekli, že budeme komprimovat a minifikovat obsah, kde to jen půjde. 
Tohle za nás vyřeší `CompressionPlugin` a `webpack.optimize.UglifyJsPlugin`.

CSS kód budeme minifikovat pomocí `postcss-clean`, který jsme přidali prve do `postcss.config.js`.
To je vše. Teď stačí spustit `yarn run build` nebo `yarn run build:production`, popřípadě `yarn run server`, 
pokud se vrhneme do dalšího vývoje naší aplikace.

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
 
PS: Všechny kódy jsou veřejně dostupné na https://github.com/OzzyCzech/webpack-the-right-way/
