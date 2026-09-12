# Viikko 3: oma sovellus verkkoon — Docker ja Vercel

Tämä on valmis hosting-esimerkki viikon 1 sovellukselle ja viikon 2 valmentajalle.
Valitse yksi reitti. Docker opettaa ajettavan paketin; Vercel näyttää julkaisun
Git-reposta. Molemmissa myös **Valmentaja toimii**, ei vain etusivu.

## Mitä tässä oikeasti julkaistaan?

```text
Selain: React + paikallinen SQLite (OPFS)
    → POST /agent-api/coach/ask, mukana tämän selaimen kotitalous
Python: testattu homework_core.py → vastaus selaimeen
```

Kotitalouden tiedot ovat edelleen **selaimessa**, eivät palvelimen tietokannassa.
Palvelin käsittelee valmentajalle lähetetyn kopion vain pyynnön ajan. Hosting-API
ei kirjoita viikon 2 yhteistä tiedostomuistia eikä tarjoa `/sessions`-reittiä.
Siksi toinen kävijä ei saa edellisen kävijän keskusteluhistoriaa.

Tämä ei ole kirjautuminen eikä käyttäjäkohtainen pilvitallennus. Käytä keksittyjä
nimiä ja tehtäviä. Samalla selainprofiililla sovellusta käyttävät jakavat sen
paikalliset tiedot. Toinen laite aloittaa tyhjästä. Uusi verkkotunnus, portti tai
esikatseluosoite on selaimelle uusi tallennuspaikka. Vie varmuuskopio vanhasta
osoitteesta ja tuo se uuteen tarvittaessa.

**API-avaimia ei tarvita.** Nykyinen web-valmentaja käyttää Python-ytimen
laskentaa ja vastaustekstiä. Se ei kutsu Geminiä. Viikon 2 CLI ja paikallinen
muisti säilyvät erillisinä esimerkkeinä. Avaimen lisääminen ympäristömuuttujaan
ei kytke mallia automaattisesti tähän hosting-APIin.

## Reitti A: Docker omalla koneella

Esiehdot: Git sekä käynnissä oleva Docker Desktop tai muu Docker Engine, jossa
on Compose. Komennot ajetaan tämän repon juuressa.

```bash
docker compose up --build -d
docker compose ps
```

Avaa **http://localhost:8080**. Docker rakentaa Reactin Node-vaiheessa ja kopioi
valmiit tiedostot Python-kuvaan. Yksi palvelu tarjoaa käyttöliittymän ja API:n.
Et tarvitse erillisiä Node- tai Python-asennuksia tähän reittiin.

```bash
curl http://localhost:8080/agent-api/health
```

Odotettu vastaus: `{"status":"ok","mode":"stateless-demo"}`.

Jos portti on varattu, macOS/Linux:

```bash
APP_PORT=8088 docker compose up --build -d
```

PowerShell: `$env:APP_PORT="8088"`, sitten sama `docker compose up --build -d`.
Avaa tällöin http://localhost:8088. Älä käytä eri porttia ja odota vanhojen
selainkohtaisten tietojen ilmestyvän siihen automaattisesti.

### Kokeile ja tutki

1. Asetukset → lisää keksitty jäsen ja tehtävä.
2. Valmentaja → Tämän päivän suunnitelma. Tarkista oikea jäsen ja tehtävä.
3. Päivitä selain. Avaa myös `/coach` ja `/setup` suoraan osoiteriviltä.
4. Aja `docker compose restart`, päivitä sama selainosoite ja tarkista tiedot.
5. Avaa yksityinen selainikkuna: sen taulu on erillinen.

```bash
docker compose logs --tail=50 app
docker compose stop
docker compose start
docker compose down
```

`down` poistaa tämän Compose-projektin kontin ja verkon. Se ei tyhjennä selaimen
taulua. Tässä ei ole palvelintietokantaa eikä Docker-volumea: lisäämällä volumen
et siirrä selaimen SQLite-tietoja palvelimelle.

### Docker myös verkkoon

Docker ei itsessään ole hosting-palvelu. Voit viedä tämän Dockerfilen esimerkiksi
Renderin Docker Web Serviceen:

1. Vie oma kopiosi Git-palveluun. Valitse Renderissä uusi Web Service ja repo.
2. Valitse Docker; Dockerfile on repon juuressa. Kuunteleva portti tulee
   palvelun `PORT`-muuttujasta, oletus on 8080.
3. Aseta health check -poluksi `/agent-api/health`.
4. Tarkista palvelun hinta ja alue ennen luontia. Esimerkki ei lupaa ilmaista
   käyttöä. Julkaise ja suorita yllä oleva selainkoe palvelun HTTPS-osoitteessa.

Paikallinen Compose sitoo portin vain localhostiin. Älä muuta sitä julkiseksi
palvelimeksi ilman HTTPS:ää ja sovittua pääsynhallintaa. Docker-kuva toimii
ilman root-oikeuksia. Compose käyttää lisäksi vain luku -tiedostojärjestelmää.
Hallittu host ei automaattisesti käytä Composen lisärajoja.

## Reitti B: Vercel — käyttöliittymä ja Python samassa projektissa

Esiehdot: oma Git-repo ja Vercel-tili. Tämä julkaisee verkkopalvelun valitsemaasi
projektiin; tarkista näkyvyys ja käyttöehdot ennen Deploy-painiketta.

1. Commitoi esimerkin tiedostot omaan repoosi ja pushaa muutokset.
2. Vercel → Add New Project → tuo repo.
3. **Root Directory:** repon juuri. **Framework Preset:** Vite.
4. `vercel.json` määrittää build-komennon `npm run build` ja tuloshakemiston
   `dist`. Python käyttää juuren `requirements.txt`-tiedostoa ja versiota 3.12.
5. Älä aseta `VITE_HOMEWORK_COACH_URL`-muuttujaa: valmis UI käyttää saman
   osoitteen `/agent-api`-reittiä. Älä lisää Gemini-avainta.
6. Julkaise. Avaa `/agent-api/health`, sitten sovelluksen `/setup` ja `/coach`.
7. Tee sama viiden kohdan selainkoe kuin Dockerissa.

Vercel tarjoaa React-tiedostot ja `api/index.py`-Python-funktion. Reititys vie
`/agent-api/*`-pyynnöt Pythonille. Kolme selainreittiä ohjataan `index.html`iin.
Tuntemattomia API-reittejä ei peitetä SPA-varasivulla.

Tässä olemassa oleva Vite-sovellus käyttää `/api`-Python-funktiota. Vercelin
uusi Services-malli on erillinen vaihtoehto usean palvelun projekteille; tätä
esimerkkiä ei tarvitse muuttaa Services-projektiksi. Varmista, ettei tuonti
vaihtanut frameworkia FastAPIksi: silloin reititys ja staattinen build muuttuvat.

Vercelin funktiolevy ei ole pysyvä tietokanta. `/tmp` ei ratkaise muistia eikä
käyttäjien erottelua. Tämä esimerkki ei kirjoita sinne kotitalouksia.

### Lokit, korjaus ja palautus

- Build epäonnistui: lue Build Logs. Aja ensin omalla koneella `npm ci` ja
  `npm run build`. Korjaa ensimmäinen todellinen virhe.
- Valmentaja ei vastaa: tarkista Network-välilehdeltä `/agent-api/coach/ask`
  ja Vercelin funktion lokit. `422` tarkoittaa virheellistä/rajojen ulkopuolista
  syötettä, `413` liian suurta pyyntöä. HTML-vastaus API:sta viittaa reititykseen.
- API kutsuu localhostia: poista vanha `VITE_HOMEWORK_COACH_URL` projektin
  ympäristöasetuksista ja rakenna uudelleen. Vite-arvot kiinnittyvät buildissa.
- Tiedot näyttävät kadonneen: tarkista osoite ja selainprofiili. Preview ja
  tuotanto eivät jaa selaimen paikallista tallennusta.
- Uusi versio rikkoutui: julkaise edellinen tunnettu Git-versio tai käytä
  hostin palautustoimintoa. Tarkista health ja Coach myös palautuksen jälkeen.
- Vanha UI näkyy: sovellus käyttää service workeria. Sulje muut välilehdet ja
  lataa uudelleen. Älä tyhjennä sivuston kaikkia tietoja, jos haluat säilyttää taulun.

## Mitä AI tekee tässä harjoituksessa?

Anna koodausagentille ensin tämä tutkimusprompti:

```text
Read docs/hosting.md, Dockerfile, vercel.json, hosting/app.py and the
existing browser storage. Explain where each component runs and where
data persists. Identify the chosen host's build/start commands and limits.
Do not deploy, create accounts, change billing or read secret values.
```

Kun korjaat omaa sovellustasi:

```text
Prepare the smallest deployment change for my chosen host. Reuse the
working example. Keep secrets out of browser bundles and images. Run the
build and hosting tests. Show the exact failing request and its cause
before fixing it. Record what is locally verified and what needs a cloud
test. Do not replace real persistence with /tmp or claim auth is implemented.
```

## Valmis hosting-palautus

- Toimiva URL tai paikallinen Docker-demo sekä käytetty Git-versio.
- Kuva: selain → hosting/API → tallennus. Kerro myös mikä ei tallennu.
- Näyttö toimivasta Coach-pyynnöstä, suorasta `/coach`-avauksesta ja reloadista.
- Näyttö erillisen selaimen tyhjästä taulusta. Tämä todistaa selainrajan,
  **ei käyttäjäkohtaista authorisointia**.
- Yksi lokista selvitetty virhe ja korjaus.
- Hostin kulujen seuranta ja pysäytyskeino. Hälytys ei välttämättä pysäytä laskua.

## Seuraava harjoitus: oikeat käyttäjät

Ennen oikean perheen tietoja tarvitaan sovittu tietomalli, kirjautuminen,
palvelinpuoliset kotitalousjäsenyyden tarkistukset, suojatut agenttityökalut,
tarvittaessa jaettu pysyvä tallennus ja sen palautus sekä käyttömäärien rajaus.
Hosting ei lisää näitä. Tässä on vain rungon rajat: rajattu pyyntökoko, syötteen
tarkistus, ei yhteistä historiaa eikä maksullisia mallikutsuja.

## Kehittäjän tarkistukset

```bash
npm ci
npm test
npm run build
python3 -m venv .venv-hosting
.venv-hosting/bin/pip install -r requirements.txt pytest httpx
.venv-hosting/bin/python -m pytest tests/hosting -q
docker compose up --build -d
npm run test:hosting:browser
```

PowerShellissä Python-komennot ovat `.venv-hosting\Scripts\python` ja
`.venv-hosting\Scripts\pip`. Selaintesti tarvitsee Node-riippuvuudet ja
Playwright Chromiumin (`npx playwright install chromium`). Se käyttää omaa
väliaikaista selainkontekstia ja keksittyä jäsentä. `APP_URL` vaihtaa kohteen;
aja vain omaan testijulkaisuun. Kuvakaappaus: `artifacts/hosting-coach.png`.

Kontin uudelleenkäynnistys saman selainistunnon aikana voidaan testata myös
automaattisesti: aseta `HOSTING_DOCKER_PROJECT` oman Compose-testiprojektisi
nimeksi. Selaintesti käynnistää vain kyseisen projektin `app`-palvelun uudelleen.
Älä aseta muuttujaa pilvi-URL:n testissä.

## Lähteet ja tekninen kuvaus

- [Vercel Python](https://vercel.com/docs/functions/runtimes/python)
- [Python /api -funktiot](https://vercel.com/docs/functions/runtimes/python/api-directory)
- [Docker ja FastAPI](https://fastapi.tiangolo.com/deployment/docker/)
- [Render Docker](https://render.com/docs/docker)
- [Vercel kulurajat](https://vercel.com/docs/spend-management)
- [Hosting-alijärjestelmä](subsystems/hosting/README.md)

Pilvihostin toiminta vahvistetaan vasta julkaistun URL:n testeillä. Paikallinen
Python-testi ei yksin todista Vercelin buildia tai pilvireititystä.
