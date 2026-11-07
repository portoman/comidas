import type { Recipe } from "../types";
import { BABY, ing, PRESSURE_SAFETY, STORAGE } from "./helpers";

export const cremasRecipes: Recipe[] = [
  {
    id: "crema-calabaza-pollo",
    number: 23,
    name: "Crema de calabaza con pollo",
    category: "cremas-verduras",
    summary: "Crema suave de calabaza, zanahoria y patata con pollo desmenuzado por encima.",
    image: null,
    prepMinutes: 15,
    cookMinutes: 30,
    servings: 3,
    ingredients: [
      ing("calabaza", 700, "g", "pelada, en dados de 3 cm"),
      ing("patata", 200, "g", "en dados de 3 cm"),
      ing("zanahoria", 1, "ud", "en rodajas"),
      ing("puerro", 1, "ud", "la parte blanca, en rodajas"),
      ing("pechuga-pollo", 300, "g", "entera"),
      ing("aceite-oliva", 2, "cda"),
      ing("nuez-moscada", 1, "pizca", "opcional", true),
      ing("sal", undefined, "al-gusto"),
    ],
    steps: [
      { text: "Pela la calabaza (más fácil si la calientas 2 minutos en el microondas), retira las semillas y córtala en dados de 3 cm. Pela la patata y córtala igual. Lava muy bien el puerro, que suele tener tierra entre las capas." },
      { text: "En una olla con el aceite a fuego medio (5 de 9), sofríe el puerro y la zanahoria 6 minutos sin que tomen color.", minutes: 6, appliance: "vitro" },
      { text: "Añade la calabaza, la patata y la pechuga entera. Cubre con 800 ml de agua. Lleva a ebullición, baja a fuego medio-bajo y cuece 15 minutos tapado.", minutes: 18, appliance: "vitro" },
      { text: "Saca la pechuga y comprueba que está hecha cortándola por la parte más gruesa: blanca y sin partes rosadas. Si no, devuélvela 3-4 minutos. Deja templar y desmenúzala con dos tenedores." },
      { text: "Comprueba que la calabaza y la patata se deshacen al pincharlas. Retira la mitad del caldo a una jarra y tritura las verduras con la batidora, añadiendo caldo poco a poco hasta la textura deseada (más espesa para el bebé)." },
      { text: "Separa la ración del bebé. Sala el resto, añade la nuez moscada y sirve con el pollo desmenuzado y un hilo de aceite crudo." },
    ],
    pressureCooker: {
      minutesAtPressure: 6,
      pressure: "alta",
      release: "natural",
      steps: [
        "Sofríe el puerro y la zanahoria en la olla destapada.",
        "Añade las verduras, la pechuga y solo 600 ml de agua.",
        "Cierra y, al alcanzar presión alta, cuenta 6 minutos. Deja bajar la presión de forma natural (10 minutos).",
        "Nunca tritures dentro de una olla cerrada ni con el líquido hirviendo a borbotones: deja templar 2-3 minutos.",
        PRESSURE_SAFETY,
      ],
    },
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
