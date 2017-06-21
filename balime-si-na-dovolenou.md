# Webpack: Balíme si na dovolenou v produkci

V tomto článku bych se rád podíval hlouběji na použití Webpack v produkční prostředí.  
   
### Co vzít sebou, aneb definice požadavků 

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

### Cestovní dokumenty

Pro správu balíčků využijeme [Yarn](https://yarnpkg.com/lang/en/) a začneme jeho nastavením. Release webové aplikace 
by měl být co možná nejvíc neprůstřelný. **Yarn** k tomu poskytuje skvělé nástroje. Nastavíme jej tak, aby všechny  
**Offline mirror**

 
 ```bash
yarn add 
```

### Jak bude vypadat náš release

Bude velmi jednoduchý, bude se jenat pouze o stažení a sestavení nového kódu a jeho následný přenos:

```bash
git fetch origin && git reset --hard master
git clean -df -e offline
git clone 
```

Sestavíme aplikaci a připravíme nové soubory:

```bash
yarn install --prefer-offline && yarn run 'build:production'
```

Na závěr přeneseme vytvořené data do složky `/var/www/web/public`:  

```bash
rsync -avh ./public /var/www/web --delete-after
```
