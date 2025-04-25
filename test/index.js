const scrapeMercadoLibre = require('../dist/index.js')

scrapeMercadoLibre.scrapeMercadoLibre("ford fiesta 2015")
.then(result => console.log(result))
.catch(err => console.log(err))

//scrapeMercadoLibre.scrapeMercadoLibre("ford fiesta 2015", 2)