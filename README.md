# Memory Maze Escape

## Opis

Memory Maze Escape je web bazirana igra lavirinta koja testira vaše pamćenje i veštine navigacije. Igrači moraju da zapamte put kroz lavirint za kratko vreme pre nego što zidovi postanu nevidljivi, a zatim da stignu do cilja izbegavajući udarce u zid.

## Karakteristike

- Više nivoa sa rastućom težinom.
- Sistem za pamćenje vremena za gledanje lavirinta pre nego što postane nevidljiv.
- Praćenje najboljeg vremena i broja pokušaja po nivou za svakog korisnika.
- Sistem registracije i logovanja korisnika (koristeći Local Storage).
- Leaderboard koji prikazuje najbolje rezultate svih igrača.
- Sistem dostignuća (Achievements).
- Mogućnost resetovanja progresa.
- Promenljive teme (svetla/tamna).
- Zvučni efekti (udarac, pobeda, pozadinska muzika).
- Kontrole putem tastature (strelice/WASD) i prevlačenjem prsta (swipe) na mobilnim uređajima.
- Responzivni dizajn za igranje na različitim veličinama ekrana.

## Kako Igrati

1.  **Registracija/Login:** Kreirajte nalog ili se ulogujte sa postojećim.
2.  **Meni:** Izaberite "Započni Igru" da biste počeli od poslednjeg otključanog nivoa.
3.  **Gledanje Lavirinta:** Na početku svakog nivoa, imaćete nekoliko sekundi da vidite ceo lavirint. Zapamtite put od starta (zeleno) do cilja (crveno).
4.  **Igranje:** Nakon isteka vremena za gledanje, zidovi postaju nevidljivi (iste boje kao putanja). Koristite strelice/WASD na tastaturi ili prevucite prstom po ekranu (gore, dole, levo, desno) da biste pomerili igrača.
5.  **Cilj:** Stignite do crvenog polja da biste prešli nivo.
6.  **Sudar:** Ako udarite u nevidljivi zid, moraćete da pokušate nivo ponovo. Broj pokušaja se beleži.
7.  **Napredak:** Uspešnim prelaskom nivoa otključavate sledeći. Vaš napredak, najbolja vremena i dostignuća se čuvaju.

## Pokretanje Lokalno

1.  Klonirajte repozitorijum ili preuzmite fajlove.
2.  Otvorite fajl `index.html` u vašem web browseru.
    - _Napomena:_ Za pokretanje sa zvukovima, možda će biti potrebno pokrenuti lokalni server (npr. pomoću VS Code Live Server ekstenzije) zbog sigurnosnih ograničenja browsera pri učitavanju lokalnih fajlova.

## Korišćene Tehnologije

- HTML5
- CSS3 (sa CSS varijablama za teme)
- JavaScript (Vanilla JS)
- Web Storage API (Local Storage) za čuvanje podataka korisnika i progresa.

## Autor

- **Mladen Lalović**
  - Instagram: [@lalovic203\_](https://www.instagram.com/lalovic203_)
  - Email: mladenlalovic01@gmail.com

## Moguća Buduća Unapređenja

- Dodavanje više nivoa i kompleksnijih lavirinata.
- Raznovrsnija dostignuća (npr. za brzinu, za prelazak bez greške).
- Animacije igrača ili efekata.
- Vizuelno atraktivniji dizajn.
- Implementacija pravog backend-a umesto Local Storage za trajnije čuvanje podataka i globalni leaderboard.
- Podešavanja jačine zvuka.
