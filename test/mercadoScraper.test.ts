import { scrapeMercadoLibre } from '../src/scraper';

const shouldListAnouncements =  () => {
    scrapeMercadoLibre('ford fiesta 2015')
    .then( items => console.log(items))
    .catch(error => console.log(error));
}

shouldListAnouncements();