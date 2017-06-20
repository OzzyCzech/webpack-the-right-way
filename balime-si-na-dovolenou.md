# Webpack: Balíme si na dovolenou v produkci

V tomto článku bych se rád podíval hlouběji na použití Webpack v produkční prostředí.
   
### Začneme definicí požadavku. 

V produkčním prostředí potřebujeme neprůstřelné verzování všech statickýcj souborů. Abychom nemuseli řešit,
že nějaký webový klient nestáhl aktuální verzi Javascript kód a jeho aplikace se z těchto důvodů chová podivně.
Totéž platí pro CSS soubory, které bychom rádi měli samostatně ve statickém souboru, navíc se tím zrychlí jejich 
zpracování prohlížečem.

Javascript kód třetích stran, budeme chtít vyčlenit do samostatného souboru. Tento kód se totiž mění méně často, 
narozdíl od samotného kódu aplikace. Jedná se například o kód frameworku nebo různé obsáhlé javascript knihovny.

Statický obsah, u kterého to má smysl, proženeme při sestavování aplikace gzip kompresí a uložíme do samostatných souborů. 
Ušetříme tím vypočetní výkon serveru - ten bude moci rovnou vracet námi kompimované soubory.
 