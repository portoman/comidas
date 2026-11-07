import type { Recipe } from "../types";
import { BABY, ing, STORAGE } from "./helpers";

export const cremasRecipes: Recipe[] = [
  {
    id: "crema-calabaza-pollo",
    number: 23,
    name: "Crema de calabaza con pollo",
    category: "cremas-verduras",
    summary: "Crema suave de calabaza, zanahoria y patata con pollo desmenuzado por encima.",
    image: null,
    prepMinutes: 10,
    cookMinutes: 25,
    servings: 3,
    ingredients: [
      ing("calabaza", 700, "g", "pelada, en dados de 3 cm"),
      ing("patata", 200, "g", "en dados de 3 cm"),
      ing("zanahoria", 1, "ud", "en rodajas"),
      ing("puerro", 1, "ud", "la parte blanca, en rodajas"),
      ing("pechuga-pollo", 300, "g", "en 3 trozos grandes"),
      ing("aceite-oliva", 2, "cda"),
      ing("nuez-moscada", 1, "pizca", "opcional", true),
      ing("sal", undefined, "al-gusto"),
    ],
    steps: [
      { text: "Pela la calabaza (más fácil si la calientas 2 minutos en el microondas), retira las semillas y córtala en dados de 3 cm. Pela la patata y córtala igual. Lava muy bien el puerro, que suele tener tierra entre las capas, y córtalo en rodajas. Corta la pechuga en 3 trozos." },
      { text: "En la olla rápida destapada, con el aceite a fuego medio (5 de 9), sofríe el puerro y la zanahoria 4 minutos sin que tomen color.", minutes: 4, appliance: "olla-rapida" },
      { text: "Añade la calabaza, la patata, la pechuga y 600 ml de agua. Cierra a fuego máximo." },
      { text: "Cuando suba la válvula (presión alta), baja el fuego y cuenta 6 minutos. Retira del fuego y deja que baje la presión sola (unos 8 minutos).", minutes: 18, appliance: "olla-rapida" },
      { text: "Abre, saca la pechuga y comprueba que está blanca por dentro, sin partes rosadas. Desmenúzala con dos tenedores." },
      { text: "Retira la mitad del caldo a una jarra y tritura las verduras con la batidora, añadiendo caldo poco a poco hasta la textura deseada (más espesa para el bebé). Deja templar 2 minutos antes de triturar para no salpicarte.", minutes: 3 },
      { text: "Separa la ración del bebé. Sala el resto, añade la nuez moscada y sirve con el pollo desmenuzado y un hilo de aceite crudo." },
    ],
    pressureCooker: { minutesAtPressure: 6, pressure: "alta", release: "natural" },
    alternative: "Sin olla rápida: cuece las verduras y la pechuga con 800 ml de agua en una olla tapada 15-18 minutos (unos 40 minutos en total).",
    baby: {
      texture: "Crema espesa con pollo desmenuzado muy fino mezclado, o pollo en hebras aparte.",
      howTo: [
        "Deja su ración algo más espesa (con menos caldo) para que no gotee de la cuchara: favorece que aprenda a tragar texturas.",
        "Mezcla 2-3 cucharadas de pollo muy desmenuzado con la crema, o tritúralo junto con ella si aún toma purés finos.",
        "Puedes añadir un chorrito de aceite de oliva crudo a su ración.",
      ],
      warnings: [BABY.noSalt, BABY.meatDone, BABY.temp, BABY.pediatra],
    },
    freezable: true,
    freezingNotes: "La crema se congela muy bien hasta 3 meses (la patata puede volverla algo más espesa: añade agua al recalentar). Congela el pollo aparte.",
    storage: [STORAGE.cool, STORAGE.fridge3, STORAGE.reheat, STORAGE.portions, STORAGE.thaw],
    tags: ["olla rápida", "para dos días"],
  },
];
