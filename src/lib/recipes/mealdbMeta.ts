/**
 * Data TheMealDB does not provide, for every dish on the menu (fetched 2026-11-04):
 * true when the instructions bake, roast or use an oven, so the "No oven" kitchen
 * setting can hide the dish. Detected from the instruction text.
 *
 * Dishes added to TheMealDB later are simply missing here: they are treated as not
 * needing an oven on the menu until this file is regenerated.
 */
export const MENU_NEEDS_OVEN: Record<string, boolean> = {
  "53373": false, "53366": false, "52952": false, "52956": false, "53367": true, "53365": false,
  "53372": false, "52955": false, "53370": true, "52951": false, "52954": false, "52945": false,
  "52946": false, "52947": false, "53377": false, "53383": false, "53378": false, "52953": false,
  "53375": false, "53374": false, "53371": false, "53369": false, "53368": true, "53376": false,
  "52949": false, "52950": false, "52948": false, "53193": false, "53211": false, "52827": true,
  "52774": false, "53191": false, "53192": false, "53200": false, "53204": false, "53209": false,
  "53201": false, "53199": false, "53206": false, "53208": false, "53195": false, "53212": true,
  "53198": false, "53214": false, "52814": false, "53197": false, "53205": false, "53210": true,
  "53203": false, "53213": false, "53202": false, "53207": false, "53196": false, "53194": false,
  "53239": false, "53242": true, "52997": false, "53238": false, "53245": false, "53244": false,
  "53230": false, "53227": false, "53234": false, "53248": true, "53233": false, "53247": false,
  "53229": false, "53246": false, "53240": false, "53249": false, "53251": true, "53250": true,
  "53228": false, "53232": false, "52828": true, "53231": true, "53237": true, "53243": false,
  "53241": false, "53235": false, "53236": false, "52831": false, "52773": false, "53033": false,
  "53034": false, "52820": false, "53065": false, "52772": true, "53032": true, "52871": false,
  "53049": true, "53050": true, "53053": false, "52821": false, "53048": false, "53051": false,
  "53052": false, "53054": false, "53071": false, "53070": false, "53068": false, "53069": false,
  "53072": false, "53073": true, "53074": false, "53075": false, "52961": true, "52796": false,
  "52839": false, "53064": false, "52835": false, "52844": true, "52777": false, "52810": true,
  "52837": false, "53014": true, "52780": true, "52811": true, "52783": false, "52823": false,
  "52982": false, "52770": false, "52771": false, "52849": true, "52866": true, "52775": true,
  "52838": false, "53158": false, "53169": false, "53156": true, "53147": false, "53161": false,
  "53186": true, "53166": false, "53170": true, "53168": false, "53157": false, "53185": false,
  "53159": false, "53153": true, "53154": false, "53148": false, "53143": true, "53149": true,
  "53178": false, "53144": false, "53180": false, "53179": true, "53145": true, "53086": false,
  "53150": false, "53151": false, "53152": false, "53172": true, "53160": false, "53162": false,
  "53174": false, "53173": false, "52942": true, "53171": false, "52836": false, "53167": false,
  "53177": false, "53181": false, "53164": true, "53155": true, "53163": false, "53183": false,
  "53184": false, "53182": false, "53176": false, "52872": false, "53175": true, "53142": false,
  "53165": true, "53011": false, "52764": false, "53012": true, "53007": true, "53009": false,
  "53010": false, "53006": false, "53008": true, "52885": false, "52893": true, "52768": true,
  "52959": true, "52767": true, "52894": true, "52848": false, "52874": true, "52878": true,
  "52873": true, "52824": true, "52803": true, "52891": true, "52792": true, "52842": false,
  "52897": true, "52898": true, "52846": true, "52875": true, "52853": false, "52966": true,
  "52990": true, "52788": true, "52989": false, "52988": true, "53096": false, "52841": false,
  "53098": true, "52899": true, "52888": true, "52895": true, "52791": false, "52802": true,
  "52896": true, "52890": true, "52887": false, "52877": true, "52884": true, "52900": true,
  "52880": true, "52991": true, "52876": true, "52864": true, "52902": true, "52901": true,
  "52960": false, "52784": false, "52886": true, "52881": true, "52883": true, "52793": true,
  "53005": true, "52889": false, "52882": true, "52822": true, "52892": true, "52845": true,
  "52863": false, "52867": true, "53097": true, "52826": true, "52819": false, "52765": true,
  "52870": true, "52830": true, "53067": true,
};
