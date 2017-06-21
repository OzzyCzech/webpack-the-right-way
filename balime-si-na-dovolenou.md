# Webpack: Balíme si na dovolenou v produkci

V tomto článku bych se rád podíval hlouběji na použití Webpack v produkční prostředí.  
   
### Co vzít sebou aneb definice požadavků 

V produkčním prostředí potřebujeme neprůstřelné verzování všech statických souborů. Abychom nemuseli řešit,
že nějaký prohlížeč návštěvníka webu nestáhl poslední verzi Javascript kód a jeho aplikace se z těchto důvodů chová podivně.
Totéž platí pro CSS soubory, které bychom rádi měli samostatně ve statickém souboru. Zrychlí se tím jeho zpracování 
a navíc statický soubor si bude prohlížeč schopen uložit do lokální cache.

Javascript třetích stran, jako jsou knihovny a frameworky, obvykle neměníme tak často, narozdíl od kódu naší aplikace. 
Bude lepší tento kód vyčlenit do samostatného souboru. Navíc tento kód bývá rozsáhlý - klidně několik megabajtů 
Javascriptu - je zbytečné, aby jej návštěvník stahoval s každou drobnou změnou aplikace znovu.

Javascript a CSS budeme samozřejmě servírovat minifikovaný. Statické soubory jako obrázky, fonty a podobně opatříme hash   

Statický obsah, u kterého to má smysl, proženeme při sestavování aplikace gzip kompresí a uložíme do samostatných souborů. 
Ušetříme tím vypočetní výkon serveru - ten bude moci rovnou vracet námi kompimované soubory.

Náš release na produkční prostředí bude vypadat následovně

```

```

### Cestovní dokumenty
