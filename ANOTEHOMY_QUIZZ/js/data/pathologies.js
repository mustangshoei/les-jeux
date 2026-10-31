/* ==========================================================================
   Anotehomy Quizz - data/pathologies.js
   RECENSEMENT DES PATHOLOGIES (donnees seules : aucun mode de jeu ne les utilise encore).
   Prevu pour le jeu « Les pathologies » (chapitre « La langue medicale »).
   --------------------------------------------------------------------------
   Une ligne par pathologie :
     P(id, nom, specialite, mecanisme, difficulte, resume, options)
       specialite : cle de SPECIALITES (la specialite qui la prend en charge)
       mecanisme  : cle de MECANISMES (la cause principale)
       difficulte : 1 = tres connue du grand public ; 2 = connue avec quelques notions ;
                    3 = reservee aux soignants et aux etudiants avances
       resume     : une phrase, sans le nom de la pathologie
       options    : alt (autres noms acceptes : sigles, synonymes courants),
                    old (anciens termes et eponymes, reconnus mais a ne plus employer)
   La liste est triee par difficulte (1 a 3), puis par specialite et par nom.
   ========================================================================== */
(function () {
  'use strict';

  const SPECIALITES = {
    cardio: 'Cardiologie', pneumo: 'Pneumologie', gastro: 'Gastro-entérologie et hépatologie',
    endo: 'Endocrinologie et métabolisme', neuro: 'Neurologie', psy: 'Psychiatrie',
    nephro: 'Néphrologie et urologie', gyneco: 'Gynécologie et obstétrique',
    rhumato: 'Rhumatologie et orthopédie', derm: 'Dermatologie', ophtalmo: 'Ophtalmologie',
    orl: 'ORL et stomatologie', hemato: 'Hématologie', onco: 'Cancérologie',
    infectio: 'Maladies infectieuses', immuno: 'Immunologie et allergies',
    genetique: 'Maladies génétiques', nutrition: 'Nutrition et carences',
    urgences: 'Urgences et traumatologie'
  };
  const MECANISMES = {
    infectieux: 'Infectieux', tumoral: 'Tumoral', vasculaire: 'Vasculaire', inflammatoire: 'Inflammatoire',
    autoimmun: 'Auto-immun', degeneratif: 'Dégénératif', metabolique: 'Métabolique', genetique: 'Génétique',
    congenital: 'Congénital', allergique: 'Allergique', toxique: 'Toxique', traumatique: 'Traumatique',
    carentiel: 'Carentiel', psychique: 'Psychique', fonctionnel: 'Fonctionnel', mecanique: 'Mécanique'
  };
  const DIFFICULTES = { 1: 'Très connue', 2: 'Un peu connue', 3: 'Difficile' };

  const PATHOLOGIES = [];
  function P(id, nom, specialite, mecanisme, difficulte, resume, o = {}) {
    PATHOLOGIES.push({ id, nom, specialite, mecanisme, difficulte, resume, alt: o.alt || [], old: o.old || [] });
  }

  /* ===================== Difficulte 1 : tres connues ===================== */

  /* ---------------- Cardiologie ---------------- */
  P("infarctus-myocarde", "infarctus du myocarde", "cardio", "vasculaire", 1, "Nécrose d'une partie du muscle cardiaque, une artère coronaire s'étant bouchée.", { alt: ["crise cardiaque"] });
  P("hypertension-arterielle", "hypertension artérielle", "cardio", "vasculaire", 1, "Pression du sang durablement trop élevée dans les artères.", { alt: ["HTA"] });
  P("arret-cardiaque", "arrêt cardiaque", "cardio", "vasculaire", 1, "Interruption brutale de la fonction de pompe du cœur, qui impose un massage immédiat.", { alt: ["arrêt cardiorespiratoire"] });
  P("hypercholesterolemie", "hypercholestérolémie", "cardio", "metabolique", 1, "Taux de cholestérol trop élevé dans le sang, qui favorise les dépôts dans les artères.", { alt: ["excès de cholestérol"] });
  P("varices", "varices", "cardio", "vasculaire", 1, "Veines superficielles des jambes dilatées et sinueuses, par défaillance de leurs valvules.", {});
  P("thrombose-veineuse", "thrombose veineuse profonde", "cardio", "vasculaire", 1, "Caillot qui bouche une veine profonde, le plus souvent au mollet.", { alt: ["phlébite", "TVP"] });

  /* ---------------- Pneumologie ---------------- */
  P("asthme", "asthme", "pneumo", "inflammatoire", 1, "Crises d'essoufflement sifflant par rétrécissement réversible des bronches.", {});
  P("bronchite-aigue", "bronchite aiguë", "pneumo", "infectieux", 1, "Inflammation passagère des bronches, surtout virale, avec toux grasse.", {});
  P("pneumonie", "pneumonie", "pneumo", "infectieux", 1, "Infection du tissu pulmonaire, souvent à pneumocoque, avec fièvre et toux.", { alt: ["pneumopathie"], old: ["fluxion de poitrine"] });
  P("rhinopharyngite", "rhinopharyngite", "pneumo", "infectieux", 1, "Infection virale banale du nez et de la gorge.", { alt: ["rhume", "coryza"] });

  /* ---------------- Gastro-enterologie et hepatologie ---------------- */
  P("gastro-enterite", "gastro-entérite", "gastro", "infectieux", 1, "Inflammation du tube digestif, surtout virale, avec diarrhée et vomissements.", { alt: ["gastro"] });
  P("appendicite", "appendicite", "gastro", "inflammatoire", 1, "Inflammation de l'appendice, douleur de la fosse iliaque droite opérée en urgence.", {});
  P("ulcere-gastroduodenal", "ulcère gastroduodénal", "gastro", "infectieux", 1, "Perte de substance de la paroi de l'estomac ou du duodénum, liée à Helicobacter pylori.", { alt: ["ulcère de l'estomac"] });
  P("reflux-gastro-oesophagien", "reflux gastro-œsophagien", "gastro", "fonctionnel", 1, "Remontées acides de l'estomac vers l'œsophage, responsables de brûlures.", { alt: ["RGO"] });
  P("cirrhose", "cirrhose", "gastro", "toxique", 1, "Foie durci et désorganisé par une fibrose, surtout après un alcoolisme chronique.", {});
  P("lithiase-biliaire", "lithiase biliaire", "gastro", "metabolique", 1, "Calculs formés dans la vésicule, qui peuvent bloquer les voies biliaires.", { alt: ["calculs biliaires"] });
  P("maladie-hemorroidaire", "maladie hémorroïdaire", "gastro", "vasculaire", 1, "Dilatation douloureuse des veines de l'anus, parfois saignante.", { alt: ["hémorroïdes"] });
  P("constipation", "constipation", "gastro", "fonctionnel", 1, "Selles trop rares ou trop dures, avec difficulté à les évacuer.", {});
  P("toxi-infection-alimentaire", "toxi-infection alimentaire", "gastro", "infectieux", 1, "Troubles digestifs brutaux après un repas contaminé par un germe ou sa toxine.", { alt: ["intoxication alimentaire"] });
  P("intolerance-lactose", "intolérance au lactose", "gastro", "metabolique", 1, "Digestion incomplète du sucre du lait par manque de lactase, avec ballonnements.", {});

  /* ---------------- Endocrinologie et metabolisme ---------------- */
  P("diabete-type-1", "diabète de type 1", "endo", "autoimmun", 1, "Destruction des cellules du pancréas qui fabriquent l'insuline, traitée par injections.", { alt: ["DT1"], old: ["diabète insulinodépendant", "diabète maigre"] });
  P("diabete-type-2", "diabète de type 2", "endo", "metabolique", 1, "Mauvaise réponse des tissus à l'insuline, favorisée par le surpoids et la sédentarité.", { alt: ["DT2"], old: ["diabète non insulinodépendant", "diabète gras"] });
  P("obesite", "obésité", "endo", "metabolique", 1, "Excès de masse grasse retentissant sur la santé, défini par un IMC supérieur à 30.", {});

  /* ---------------- Neurologie ---------------- */
  P("avc", "accident vasculaire cérébral", "neuro", "vasculaire", 1, "Interruption brutale de la circulation dans une partie du cerveau, par caillot ou hémorragie.", { alt: ["AVC"], old: ["attaque cérébrale", "apoplexie"] });
  P("migraine", "migraine", "neuro", "fonctionnel", 1, "Crises de maux de tête pulsatiles d'un seul côté, avec nausées et gêne à la lumière.", {});
  P("epilepsie", "épilepsie", "neuro", "fonctionnel", 1, "Crises répétées dues à des décharges anormales et synchrones des neurones.", { old: ["mal comitial", "haut mal"] });
  P("alzheimer", "maladie d'Alzheimer", "neuro", "degeneratif", 1, "Démence la plus fréquente, qui détruit d'abord la mémoire des faits récents.", {});
  P("parkinson", "maladie de Parkinson", "neuro", "degeneratif", 1, "Tremblement de repos, lenteur et rigidité, par perte des neurones à dopamine.", {});
  P("meningite", "méningite", "neuro", "infectieux", 1, "Inflammation des enveloppes du cerveau, avec fièvre, maux de tête et nuque raide.", {});
  P("commotion-cerebrale", "commotion cérébrale", "neuro", "traumatique", 1, "Trouble passager du fonctionnement du cerveau après un choc sur la tête.", {});

  /* ---------------- Psychiatrie ---------------- */
  P("depression", "épisode dépressif caractérisé", "psy", "psychique", 1, "Tristesse durable, perte d'intérêt et de plaisir, avec fatigue et idées noires.", { alt: ["dépression"], old: ["mélancolie"] });
  P("trouble-anxieux", "trouble anxieux généralisé", "psy", "psychique", 1, "Inquiétude excessive et permanente, difficile à contrôler.", { alt: ["anxiété", "TAG"] });
  P("trouble-bipolaire", "trouble bipolaire", "psy", "psychique", 1, "Alternance d'épisodes dépressifs et d'épisodes d'exaltation.", { old: ["psychose maniaco-dépressive"] });
  P("schizophrenie", "schizophrénie", "psy", "psychique", 1, "Trouble psychotique avec délire, hallucinations et retrait de la vie sociale.", {});
  P("toc", "trouble obsessionnel compulsif", "psy", "psychique", 1, "Pensées envahissantes que des rituels répétés tentent d'apaiser.", { alt: ["TOC"] });
  P("anorexie-mentale", "anorexie mentale", "psy", "psychique", 1, "Restriction alimentaire volontaire et peur de grossir, avec amaigrissement majeur.", { alt: ["anorexie"] });
  P("boulimie", "boulimie nerveuse", "psy", "psychique", 1, "Crises de prise alimentaire incontrôlée suivies de conduites compensatoires.", { alt: ["boulimie"] });
  P("autisme", "trouble du spectre de l'autisme", "psy", "genetique", 1, "Particularités durables de la communication sociale, avec intérêts restreints et répétitifs.", { alt: ["autisme", "TSA"] });
  P("tdah", "trouble déficit de l'attention avec hyperactivité", "psy", "fonctionnel", 1, "Difficultés d'attention, impulsivité et agitation, présentes depuis l'enfance.", { alt: ["TDAH", "hyperactivité"] });
  P("trouble-usage-alcool", "trouble de l'usage de l'alcool", "psy", "toxique", 1, "Consommation d'alcool devenue incontrôlable malgré ses conséquences.", { alt: ["alcoolisme", "alcoolodépendance"] });
  P("insomnie", "insomnie", "psy", "fonctionnel", 1, "Difficulté durable à s'endormir ou à rester endormi, avec retentissement la journée.", {});
  P("epuisement-professionnel", "épuisement professionnel", "psy", "psychique", 1, "Usure physique et émotionnelle liée à un stress prolongé au travail.", { alt: ["burn-out"] });
  P("phobie-specifique", "phobie spécifique", "psy", "psychique", 1, "Peur intense et irraisonnée d'un objet ou d'une situation précise.", { alt: ["phobie"] });

  /* ---------------- Nephrologie et urologie ---------------- */
  P("cystite", "cystite", "nephro", "infectieux", 1, "Infection de la vessie, avec brûlures et envies fréquentes d'uriner.", { alt: ["infection urinaire"] });
  P("lithiase-urinaire", "lithiase urinaire", "nephro", "metabolique", 1, "Calculs formés dans les voies urinaires, à l'origine de coliques néphrétiques.", { alt: ["calculs rénaux", "colique néphrétique"] });
  P("insuffisance-renale-chronique", "insuffisance rénale chronique", "nephro", "degeneratif", 1, "Perte progressive et définitive de la capacité des reins à filtrer le sang.", {});
  P("incontinence-urinaire", "incontinence urinaire", "nephro", "fonctionnel", 1, "Fuites d'urine involontaires, à l'effort ou par besoin impérieux.", {});

  /* ---------------- Gynecologie et obstetrique ---------------- */
  P("endometriose", "endométriose", "gyneco", "inflammatoire", 1, "Muqueuse semblable à celle de l'utérus implantée hors de l'utérus, très douloureuse.", {});
  P("avortement-spontane", "avortement spontané", "gyneco", "fonctionnel", 1, "Arrêt naturel d'une grossesse avant la vingt-deuxième semaine.", { alt: ["fausse couche"] });
  P("infertilite", "infertilité", "gyneco", "fonctionnel", 1, "Absence de grossesse après un an de rapports réguliers sans contraception.", { alt: ["stérilité"] });

  /* ---------------- Rhumatologie et orthopedie ---------------- */
  P("fracture", "fracture", "rhumato", "traumatique", 1, "Rupture d'un os, après un choc ou sur un os fragilisé.", {});
  P("entorse", "entorse", "rhumato", "traumatique", 1, "Étirement ou déchirure des ligaments d'une articulation, surtout à la cheville.", {});
  P("luxation", "luxation", "rhumato", "traumatique", 1, "Déplacement durable des surfaces d'une articulation l'une par rapport à l'autre.", { alt: ["déboîtement"] });
  P("arthrose", "arthrose", "rhumato", "degeneratif", 1, "Usure du cartilage d'une articulation, douloureuse à l'effort et raide au réveil.", {});
  P("osteoporose", "ostéoporose", "rhumato", "metabolique", 1, "Os raréfié et fragile, exposant aux fractures après la ménopause.", {});
  P("lombalgie", "lombalgie commune", "rhumato", "mecanique", 1, "Douleur du bas du dos, le plus souvent sans lésion grave.", { alt: ["mal de dos", "lumbago", "tour de reins"] });
  P("sciatalgie", "sciatalgie", "rhumato", "mecanique", 1, "Douleur descendant dans la jambe le long du nerf ischiatique, souvent par hernie discale.", { alt: ["sciatique"] });
  P("tendinopathie", "tendinopathie", "rhumato", "mecanique", 1, "Souffrance d'un tendon par surmenage, douloureuse au mouvement.", { alt: ["tendinite"] });
  P("scoliose", "scoliose", "rhumato", "congenital", 1, "Déviation latérale et rotation permanente de la colonne vertébrale.", {});

  /* ---------------- Dermatologie ---------------- */
  P("acne", "acné", "derm", "inflammatoire", 1, "Boutons et points noirs du visage et du dos, par obstruction des follicules pileux.", {});
  P("dermatite-atopique", "dermatite atopique", "derm", "allergique", 1, "Plaques rouges qui démangent, évoluant par poussées sur une peau sèche.", { alt: ["eczéma", "eczéma atopique"] });
  P("psoriasis", "psoriasis", "derm", "autoimmun", 1, "Plaques rouges couvertes de squames blanches, aux coudes, genoux et cuir chevelu.", {});
  P("urticaire", "urticaire", "derm", "allergique", 1, "Plaques rouges en relief, fugaces et très démangeantes, comme des piqûres d'ortie.", {});
  P("brulure", "brûlure", "derm", "traumatique", 1, "Destruction de la peau par la chaleur, un produit chimique ou l'électricité.", {});
  P("erytheme-solaire", "érythème solaire", "derm", "toxique", 1, "Brûlure superficielle de la peau par les ultraviolets du soleil.", { alt: ["coup de soleil"] });
  P("melanome", "mélanome", "derm", "tumoral", 1, "Cancer des cellules pigmentaires de la peau, souvent né d'un grain de beauté.", {});
  P("verrue", "verrue", "derm", "infectieux", 1, "Excroissance rugueuse de la peau due à un papillomavirus.", {});
  P("dermatophytose", "dermatophytose", "derm", "infectieux", 1, "Infection de la peau par un champignon, comme entre les orteils.", { alt: ["mycose de la peau", "pied d'athlète"] });
  P("alopecie-androgenetique", "alopécie androgénétique", "derm", "genetique", 1, "Chute progressive des cheveux sous l'effet des hormones mâles.", { alt: ["calvitie"] });
  P("pediculose", "pédiculose du cuir chevelu", "derm", "infectieux", 1, "Infestation par les poux, avec démangeaisons du cuir chevelu.", { alt: ["poux"] });

  /* ---------------- Ophtalmologie ---------------- */
  P("myopie", "myopie", "ophtalmo", "congenital", 1, "Œil trop long : la vision de loin est floue.", {});
  P("hypermetropie", "hypermétropie", "ophtalmo", "congenital", 1, "Œil trop court : la vision de près fatigue et devient floue.", {});
  P("astigmatisme", "astigmatisme", "ophtalmo", "congenital", 1, "Cornée irrégulière : les images sont déformées à toutes les distances.", {});
  P("presbytie", "presbytie", "ophtalmo", "degeneratif", 1, "Perte d'accommodation du cristallin avec l'âge : la lecture devient difficile.", {});
  P("cataracte", "cataracte", "ophtalmo", "degeneratif", 1, "Opacification du cristallin, qui brouille la vue et se traite par chirurgie.", {});
  P("conjonctivite", "conjonctivite", "ophtalmo", "infectieux", 1, "Inflammation de la conjonctive : œil rouge, qui coule et colle au réveil.", {});
  P("strabisme", "strabisme", "ophtalmo", "fonctionnel", 1, "Défaut d'alignement des deux yeux, qui ne regardent pas le même point.", {});
  P("orgelet", "orgelet", "ophtalmo", "infectieux", 1, "Petit abcès d'un follicule de cil, au bord de la paupière.", {});
  P("dyschromatopsie-rouge-vert", "dyschromatopsie rouge-vert", "ophtalmo", "genetique", 1, "Confusion des couleurs rouge et verte, liée au chromosome X.", { alt: ["daltonisme"] });

  /* ---------------- ORL et stomatologie ---------------- */
  P("angine", "angine", "orl", "infectieux", 1, "Inflammation des tonsilles palatines, virale ou à streptocoque.", { alt: ["amygdalite", "pharyngite"] });
  P("otite-moyenne-aigue", "otite moyenne aiguë", "orl", "infectieux", 1, "Infection de l'oreille moyenne, très douloureuse chez l'enfant.", { alt: ["otite"] });
  P("sinusite", "sinusite", "orl", "infectieux", 1, "Inflammation des sinus de la face, avec douleur et nez bouché.", {});
  P("laryngite", "laryngite", "orl", "infectieux", 1, "Inflammation du larynx, avec voix rauque ou éteinte.", {});
  P("surdite", "surdité", "orl", "degeneratif", 1, "Baisse de l'audition, de transmission ou de perception.", { alt: ["hypoacousie"] });
  P("carie-dentaire", "carie dentaire", "orl", "infectieux", 1, "Destruction de l'émail et de la dentine par les acides des bactéries.", { alt: ["carie"] });
  P("gingivite", "gingivite", "orl", "inflammatoire", 1, "Inflammation des gencives, rouges et qui saignent au brossage.", {});

  /* ---------------- Hematologie ---------------- */
  P("anemie", "anémie", "hemato", "carentiel", 1, "Manque d'hémoglobine dans le sang, avec pâleur et fatigue.", {});
  P("leucemie", "leucémie", "hemato", "tumoral", 1, "Cancer des cellules du sang qui envahit la moelle osseuse.", {});
  P("hemophilie", "hémophilie", "hemato", "genetique", 1, "Le sang coagule mal par manque d'un facteur de coagulation, chez le garçon.", {});

  /* ---------------- Cancerologie ---------------- */
  P("cancer-poumon", "cancer du poumon", "onco", "tumoral", 1, "Tumeur maligne du poumon, liée au tabac dans la grande majorité des cas.", { alt: ["cancer bronchique"] });
  P("cancer-sein", "cancer du sein", "onco", "tumoral", 1, "Tumeur maligne de la glande mammaire, la plus fréquente chez la femme.", {});
  P("cancer-colorectal", "cancer colorectal", "onco", "tumoral", 1, "Tumeur maligne du côlon ou du rectum, souvent née d'un polype.", { alt: ["cancer du côlon"] });
  P("cancer-prostate", "cancer de la prostate", "onco", "tumoral", 1, "Tumeur maligne de la prostate, la plus fréquente chez l'homme âgé.", {});
  P("cancer-col-uterus", "cancer du col de l'utérus", "onco", "tumoral", 1, "Tumeur maligne du col utérin, due aux papillomavirus et évitable par vaccination.", {});

  /* ---------------- Maladies infectieuses ---------------- */
  P("grippe", "grippe", "infectio", "infectieux", 1, "Infection respiratoire saisonnière à virus influenza, avec fièvre et courbatures.", { alt: ["influenza"] });
  P("covid-19", "COVID-19", "infectio", "infectieux", 1, "Maladie due au coronavirus SARS-CoV-2, à l'origine de la pandémie de 2020.", { alt: ["covid", "coronavirus"] });
  P("sida", "syndrome d'immunodéficience acquise", "infectio", "infectieux", 1, "Effondrement des défenses immunitaires au stade avancé de l'infection par le VIH.", { alt: ["sida"] });
  P("tuberculose", "tuberculose", "infectio", "infectieux", 1, "Infection par le bacille de Koch, atteignant surtout les poumons.", { old: ["phtisie", "consomption"] });
  P("varicelle", "varicelle", "infectio", "infectieux", 1, "Éruption de vésicules qui démangent, due à un herpèsvirus, très contagieuse chez l'enfant.", {});
  P("rougeole", "rougeole", "infectio", "infectieux", 1, "Fièvre et éruption rouge très contagieuse, évitable par le vaccin.", {});
  P("herpes-labial", "herpès labial", "infectio", "infectieux", 1, "Vésicules douloureuses de la lèvre, récidivant à partir d'un virus latent.", { alt: ["bouton de fièvre"] });
  P("paludisme", "paludisme", "infectio", "infectieux", 1, "Fièvre due à un parasite transmis par l'anophèle, fréquente en zone tropicale.", { alt: ["malaria"] });
  P("peste", "peste", "infectio", "infectieux", 1, "Infection par Yersinia pestis transmise par la puce du rat, à l'origine de grandes épidémies.", {});
  P("cholera", "choléra", "infectio", "infectieux", 1, "Diarrhée massive due à une toxine bactérienne, par eau contaminée.", {});
  P("lepre", "lèpre", "infectio", "infectieux", 1, "Infection chronique de la peau et des nerfs par le bacille de Hansen.", { alt: ["maladie de Hansen"] });
  P("maladie-ebola", "maladie à virus Ebola", "infectio", "infectieux", 1, "Fièvre hémorragique très mortelle, transmise par les liquides biologiques.", {});
  P("syphilis", "syphilis", "infectio", "infectieux", 1, "Infection sexuellement transmissible par le tréponème, évoluant en plusieurs stades.", { old: ["vérole"] });
  P("tetanos", "tétanos", "infectio", "infectieux", 1, "Contractures généralisées dues à la toxine d'une bactérie des plaies souillées.", {});
  P("rage", "rage", "infectio", "infectieux", 1, "Encéphalite mortelle transmise par la morsure d'un animal infecté.", {});

  /* ---------------- Immunologie et allergies ---------------- */
  P("rhinite-allergique", "rhinite allergique", "immuno", "allergique", 1, "Nez qui coule, éternuements et yeux irrités au contact d'un allergène.", { alt: ["rhume des foins"] });
  P("allergie-alimentaire", "allergie alimentaire", "immuno", "allergique", 1, "Réaction immunitaire excessive à un aliment, de l'urticaire au choc.", {});

  /* ---------------- Maladies genetiques ---------------- */
  P("trisomie-21", "trisomie 21", "genetique", "genetique", 1, "Présence de trois chromosomes 21, avec déficience intellectuelle et traits reconnaissables.", { alt: ["syndrome de Down"], old: ["mongolisme"] });
  P("mucoviscidose", "mucoviscidose", "genetique", "genetique", 1, "Sécrétions trop épaisses encombrant les bronches et le pancréas, de transmission récessive.", { alt: ["fibrose kystique"] });
  P("dystrophie-duchenne", "dystrophie musculaire de Duchenne", "genetique", "genetique", 1, "Dégradation progressive des muscles chez le garçon, liée au chromosome X.", { alt: ["myopathie de Duchenne"] });

  /* ---------------- Nutrition, urgences et traumatologie ---------------- */
  P("denutrition", "dénutrition", "nutrition", "carentiel", 1, "Apports alimentaires insuffisants, avec fonte des muscles et de la graisse.", {});
  P("deshydratation", "déshydratation", "urgences", "metabolique", 1, "Perte d'eau supérieure aux apports, dangereuse chez l'enfant et la personne âgée.", {});
  P("coup-de-chaleur", "coup de chaleur", "urgences", "toxique", 1, "Échec de la régulation thermique, avec température très élevée et troubles de conscience.", { alt: ["insolation"] });
  P("hypothermie", "hypothermie", "urgences", "metabolique", 1, "Température du corps descendue sous 35 degrés, avec frissons puis somnolence.", {});
  P("intoxication-monoxyde", "intoxication au monoxyde de carbone", "urgences", "toxique", 1, "Gaz inodore qui prend la place de l'oxygène sur l'hémoglobine, avec maux de tête.", { alt: ["intoxication au CO"] });

  /* ===================== Difficulte 2 : connues avec quelques notions ===================== */

  /* ---------------- Cardiologie ---------------- */
  P("insuffisance-cardiaque", "insuffisance cardiaque", "cardio", "degeneratif", 2, "Cœur incapable d'assurer un débit suffisant, avec essoufflement et œdèmes.", {});
  P("angor", "angor", "cardio", "vasculaire", 2, "Douleur thoracique à l'effort par manque d'oxygène du muscle cardiaque.", { alt: ["angine de poitrine"] });
  P("fibrillation-atriale", "fibrillation atriale", "cardio", "fonctionnel", 2, "Contraction anarchique des atriums, pouls irrégulier exposant aux caillots.", { alt: ["ACFA"], old: ["fibrillation auriculaire"] });
  P("atherosclerose", "athérosclérose", "cardio", "metabolique", 2, "Plaques de graisse et de fibrose épaississant la paroi des artères.", {});
  P("anevrisme-aortique", "anévrisme de l'aorte", "cardio", "vasculaire", 2, "Dilatation permanente du plus gros tronc artériel, qui risque de se rompre.", { alt: ["anévrysme de l'aorte"] });
  P("pericardite", "péricardite", "cardio", "inflammatoire", 2, "Inflammation de l'enveloppe du cœur, douloureuse et souvent virale.", {});
  P("endocardite", "endocardite infectieuse", "cardio", "infectieux", 2, "Greffe de bactéries sur une valve cardiaque, avec fièvre prolongée.", {});
  P("myocardite", "myocardite", "cardio", "inflammatoire", 2, "Inflammation du muscle cardiaque, le plus souvent après une infection virale.", {});
  P("retrecissement-aortique", "rétrécissement aortique", "cardio", "degeneratif", 2, "Valve de l'aorte calcifiée qui s'ouvre mal, avec souffle et malaises à l'effort.", { alt: ["sténose aortique"] });
  P("insuffisance-mitrale", "insuffisance mitrale", "cardio", "degeneratif", 2, "Valve atrioventriculaire gauche qui ferme mal, laissant le sang refluer en arrière.", {});
  P("arteriopathie-membres", "artériopathie oblitérante des membres inférieurs", "cardio", "vasculaire", 2, "Artères des jambes rétrécies, avec douleur du mollet à la marche.", { alt: ["AOMI"], old: ["artérite des membres inférieurs"] });
  P("embolie-pulmonaire", "embolie pulmonaire", "pneumo", "vasculaire", 2, "Caillot migré dans une artère du poumon, avec douleur et essoufflement brutal.", {});
  P("syndrome-raynaud", "syndrome de Raynaud", "cardio", "vasculaire", 2, "Doigts qui blanchissent puis bleuissent au froid, par spasme des artérioles.", {});
  P("hypotension-orthostatique", "hypotension orthostatique", "cardio", "fonctionnel", 2, "Chute de tension au passage en position debout, avec vertiges.", {});
  P("choc-hypovolemique", "choc hypovolémique", "urgences", "vasculaire", 2, "Effondrement de la circulation par perte massive de sang ou d'eau.", {});

  /* ---------------- Pneumologie ---------------- */
  P("bpco", "bronchopneumopathie chronique obstructive", "pneumo", "toxique", 2, "Obstruction permanente des bronches due au tabac, avec toux et essoufflement.", { alt: ["BPCO"] });
  P("emphyseme", "emphysème pulmonaire", "pneumo", "degeneratif", 2, "Destruction des parois des alvéoles, qui piège l'air dans le poumon.", {});
  P("pneumothorax", "pneumothorax", "pneumo", "mecanique", 2, "Air entre les deux feuillets de la plèvre, qui fait s'affaisser le poumon.", {});
  P("pleuresie", "pleurésie", "pneumo", "inflammatoire", 2, "Épanchement de liquide dans la cavité pleurale, douloureux à l'inspiration.", { alt: ["épanchement pleural"] });
  P("bronchiolite", "bronchiolite", "pneumo", "infectieux", 2, "Infection virale des petites bronches du nourrisson, souvent à VRS.", {});
  P("apnee-du-sommeil", "syndrome d'apnées obstructives du sommeil", "pneumo", "mecanique", 2, "Pauses respiratoires répétées la nuit par fermeture du pharynx, avec ronflement.", { alt: ["apnée du sommeil", "SAOS"] });
  P("fibrose-pulmonaire", "fibrose pulmonaire", "pneumo", "degeneratif", 2, "Cicatrisation progressive du tissu du poumon, qui devient rigide.", {});
  P("silicose", "silicose", "pneumo", "toxique", 2, "Maladie professionnelle due à l'inhalation de poussières de silice.", {});
  P("asbestose", "asbestose", "pneumo", "toxique", 2, "Fibrose du poumon due à l'inhalation prolongée de fibres d'amiante.", {});
  P("sdra", "syndrome de détresse respiratoire aiguë", "urgences", "inflammatoire", 2, "Inondation brutale des alvéoles, avec manque d'oxygène grave malgré l'assistance.", { alt: ["SDRA"] });

  /* ---------------- Gastro-enterologie et hepatologie ---------------- */
  P("maladie-crohn", "maladie de Crohn", "gastro", "autoimmun", 2, "Inflammation chronique pouvant toucher tout le tube digestif, par segments.", {});
  P("rectocolite-hemorragique", "rectocolite hémorragique", "gastro", "autoimmun", 2, "Inflammation chronique continue du rectum et du côlon, avec diarrhée sanglante.", { alt: ["RCH"] });
  P("maladie-coeliaque", "maladie cœliaque", "gastro", "autoimmun", 2, "Intolérance au gluten qui détruit les villosités de l'intestin grêle.", { alt: ["intolérance au gluten"] });
  P("syndrome-intestin-irritable", "syndrome de l'intestin irritable", "gastro", "fonctionnel", 2, "Douleurs et ballonnements avec transit perturbé, sans lésion visible.", { alt: ["colopathie fonctionnelle"] });
  P("pancreatite-aigue", "pancréatite aiguë", "gastro", "inflammatoire", 2, "Autodigestion brutale du pancréas, par calcul biliaire ou par alcool.", {});
  P("diverticulite", "diverticulite", "gastro", "inflammatoire", 2, "Infection d'une hernie de la muqueuse colique, surtout du côlon sigmoïde.", {});
  P("hernie-hiatale", "hernie hiatale", "gastro", "mecanique", 2, "Remontée d'une partie de l'estomac dans le thorax à travers le diaphragme.", {});
  P("hernie-inguinale", "hernie inguinale", "gastro", "mecanique", 2, "Passage d'une anse intestinale par le canal de l'aine, formant une bosse.", {});
  P("occlusion-intestinale", "occlusion intestinale", "urgences", "mecanique", 2, "Arrêt du transit par obstacle ou paralysie de l'intestin, avec ventre ballonné.", {});
  P("peritonite", "péritonite", "urgences", "infectieux", 2, "Infection de la grande séreuse de l'abdomen, ventre dur opéré en urgence.", {});
  P("hepatite-a", "hépatite A", "gastro", "infectieux", 2, "Atteinte virale du foie transmise par l'eau et les aliments, guérissant sans séquelle.", {});
  P("hepatite-b", "hépatite B", "gastro", "infectieux", 2, "Atteinte virale du foie transmise par le sang et le sexe, pouvant devenir chronique.", {});
  P("hepatite-c", "hépatite C", "gastro", "infectieux", 2, "Atteinte virale du foie transmise par le sang, longtemps muette, aujourd'hui curable.", {});
  P("steatose-hepatique", "stéatose hépatique non alcoolique", "gastro", "metabolique", 2, "Surcharge du foie en graisse liée au surpoids, pouvant évoluer vers la fibrose.", { alt: ["NASH", "foie gras"] });
  P("cholecystite", "cholécystite", "gastro", "infectieux", 2, "Infection de la vésicule biliaire bloquée par un calcul.", {});
  P("gastrite", "gastrite", "gastro", "inflammatoire", 2, "Inflammation de la muqueuse de l'estomac, souvent due à Helicobacter pylori.", {});
  P("oesophagite", "œsophagite", "gastro", "inflammatoire", 2, "Inflammation du conduit reliant la gorge à l'estomac, le plus souvent par reflux.", {});
  P("polype-colique", "polype colique", "gastro", "tumoral", 2, "Excroissance bénigne de la muqueuse du gros intestin, à retirer car elle peut dégénérer.", {});
  P("fissure-anale", "fissure anale", "gastro", "mecanique", 2, "Déchirure de la marge de l'anus, très douloureuse à la selle.", {});
  P("salmonellose", "salmonellose", "infectio", "infectieux", 2, "Infection digestive par des salmonelles, par œufs ou volailles contaminés.", {});
  P("listeriose", "listériose", "infectio", "infectieux", 2, "Infection par Listeria, dangereuse chez la femme enceinte et l'immunodéprimé.", {});
  P("botulisme", "botulisme", "infectio", "toxique", 2, "Paralysie descendante due à la toxine de Clostridium botulinum, par conserves.", {});

  /* ---------------- Endocrinologie et metabolisme ---------------- */
  P("hypothyroidie", "hypothyroïdie", "endo", "autoimmun", 2, "Thyroïde insuffisante : fatigue, frilosité, prise de poids et ralentissement.", {});
  P("hyperthyroidie", "hyperthyroïdie", "endo", "autoimmun", 2, "Thyroïde en excès : amaigrissement, palpitations, nervosité et tremblements.", {});
  P("maladie-basedow", "maladie de Basedow", "endo", "autoimmun", 2, "Hyperthyroïdie auto-immune avec goitre et yeux exorbités.", { alt: ["maladie de Graves"] });
  P("thyroidite-hashimoto", "thyroïdite de Hashimoto", "endo", "autoimmun", 2, "Destruction auto-immune de la thyroïde, première cause d'hypothyroïdie.", {});
  P("goitre", "goitre", "endo", "carentiel", 2, "Augmentation de volume de la thyroïde, souvent par manque d'iode.", {});
  P("nodule-thyroidien", "nodule thyroïdien", "endo", "tumoral", 2, "Boule dans la thyroïde, le plus souvent bénigne, à surveiller par échographie.", {});
  P("cancer-thyroide", "cancer de la thyroïde", "onco", "tumoral", 2, "Tumeur maligne de la thyroïde, de bon pronostic dans ses formes différenciées.", {});
  P("syndrome-cushing", "syndrome de Cushing", "endo", "metabolique", 2, "Excès de cortisol : visage arrondi, bosse de bison et vergetures pourpres.", {});
  P("maladie-addison", "maladie d'Addison", "endo", "autoimmun", 2, "Insuffisance des glandes surrénales, avec fatigue, hypotension et peau bronzée.", { alt: ["insuffisance surrénale"] });
  P("acromegalie", "acromégalie", "endo", "tumoral", 2, "Excès d'hormone de croissance à l'âge adulte : mains, pieds et menton élargis.", {});
  P("diabete-insipide", "diabète insipide", "endo", "fonctionnel", 2, "Urines très abondantes et soif intense, par défaut d'hormone antidiurétique.", {});
  P("hypoglycemie", "hypoglycémie", "endo", "metabolique", 2, "Chute du sucre sanguin, avec sueurs, tremblements et malaise.", {});
  P("syndrome-metabolique", "syndrome métabolique", "endo", "metabolique", 2, "Association d'obésité abdominale, d'hypertension, de diabète et d'anomalies des lipides.", {});
  P("sopk", "syndrome des ovaires polykystiques", "gyneco", "metabolique", 2, "Cycles irréguliers, excès d'hormones mâles et ovaires multifolliculaires.", { alt: ["SOPK"] });
  P("diabete-gestationnel", "diabète gestationnel", "gyneco", "metabolique", 2, "Trouble du sucre apparaissant pendant la grossesse et disparaissant après l'accouchement.", {});
  P("hyperparathyroidie", "hyperparathyroïdie", "endo", "tumoral", 2, "Excès d'hormone parathyroïdienne, avec calcium élevé et calculs rénaux.", {});

  /* ---------------- Neurologie ---------------- */
  P("sclerose-en-plaques", "sclérose en plaques", "neuro", "autoimmun", 2, "Destruction par poussées de la myéline du système nerveux central.", { alt: ["SEP"] });
  P("sclerose-laterale-amyotrophique", "sclérose latérale amyotrophique", "neuro", "degeneratif", 2, "Perte des motoneurones, avec paralysie progressive et intelligence respectée.", { alt: ["SLA", "maladie de Charcot"] });
  P("syndrome-guillain-barre", "syndrome de Guillain-Barré", "neuro", "autoimmun", 2, "Paralysie ascendante après une infection, par atteinte des nerfs périphériques.", {});
  P("accident-ischemique-transitoire", "accident ischémique transitoire", "neuro", "vasculaire", 2, "Déficit neurologique régressif en moins d'une heure, signal d'alarme d'un AVC.", { alt: ["AIT"] });
  P("hemorragie-sous-arachnoidienne", "hémorragie sous-arachnoïdienne", "neuro", "vasculaire", 2, "Saignement autour du cerveau par rupture d'anévrisme, avec céphalée en coup de tonnerre.", { old: ["hémorragie méningée"] });
  P("hematome-sous-dural", "hématome sous-dural", "neuro", "traumatique", 2, "Collection de sang sous la dure-mère, souvent chez la personne âgée après un choc.", {});
  P("tumeur-cerebrale", "tumeur cérébrale", "onco", "tumoral", 2, "Masse intracrânienne responsable de maux de tête, de crises ou de déficits.", {});
  P("encephalite", "encéphalite", "neuro", "infectieux", 2, "Inflammation du cerveau lui-même, avec fièvre, confusion et convulsions.", {});
  P("myasthenie", "myasthénie", "neuro", "autoimmun", 2, "Fatigabilité musculaire par blocage de la jonction entre le nerf et le muscle.", {});
  P("paralysie-faciale", "paralysie faciale périphérique", "neuro", "inflammatoire", 2, "Atteinte brutale du nerf facial : une moitié du visage ne bouge plus.", { alt: ["paralysie de Bell", "paralysie a frigore"] });
  P("nevralgie-trijumeau", "névralgie du trijumeau", "neuro", "fonctionnel", 2, "Décharges fulgurantes dans une moitié du visage, déclenchées par l'effleurement.", {});
  P("neuropathie-diabetique", "neuropathie diabétique", "neuro", "metabolique", 2, "Atteinte des nerfs des pieds par le diabète, avec brûlures et perte de sensibilité.", {});
  P("syndrome-canal-carpien", "syndrome du canal carpien", "neuro", "mecanique", 2, "Compression du nerf médian au poignet, avec fourmillements nocturnes des doigts.", {});
  P("hydrocephalie", "hydrocéphalie", "neuro", "congenital", 2, "Accumulation de liquide cérébrospinal dans les ventricules, qui se dilatent.", {});
  P("narcolepsie", "narcolepsie", "neuro", "fonctionnel", 2, "Endormissements irrésistibles le jour, parfois avec chutes brutales de tonus.", {});
  P("syndrome-jambes-sans-repos", "syndrome des jambes sans repos", "neuro", "fonctionnel", 2, "Besoin impérieux de bouger les membres inférieurs le soir, soulagé par la marche.", {});
  P("syndrome-tourette", "syndrome de Gilles de la Tourette", "neuro", "genetique", 2, "Tics moteurs et vocaux multiples, débutant dans l'enfance.", {});
  P("hernie-discale", "hernie discale", "rhumato", "mecanique", 2, "Noyau du disque intervertébral sorti de sa place, comprimant une racine nerveuse.", {});

  /* ---------------- Psychiatrie ---------------- */
  P("etat-stress-post-traumatique", "état de stress post-traumatique", "psy", "psychique", 2, "Reviviscences, cauchemars et évitement après un événement traumatisant.", { alt: ["ESPT"] });
  P("trouble-panique", "trouble panique", "psy", "psychique", 2, "Attaques de panique répétées avec peur permanente de la suivante.", {});
  P("anxiete-sociale", "anxiété sociale", "psy", "psychique", 2, "Peur intense du regard et du jugement des autres, qui fait fuir les situations de groupe.", { alt: ["phobie sociale"] });
  P("trouble-borderline", "trouble de la personnalité borderline", "psy", "psychique", 2, "Instabilité des émotions, des relations et de l'image de soi, avec impulsivité.", { alt: ["état limite"] });
  P("depression-post-partum", "dépression du post-partum", "psy", "psychique", 2, "Épisode dépressif survenant dans les semaines qui suivent un accouchement.", {});
  P("hyperphagie-boulimique", "hyperphagie boulimique", "psy", "psychique", 2, "Crises de prise alimentaire massive sans conduite compensatoire.", {});

  /* ---------------- Nephrologie et urologie ---------------- */
  P("pyelonephrite", "pyélonéphrite", "nephro", "infectieux", 2, "Infection du rein, avec fièvre et douleur lombaire, compliquant une cystite.", {});
  P("syndrome-nephrotique", "syndrome néphrotique", "nephro", "inflammatoire", 2, "Fuite massive de protéines dans les urines, avec œdèmes importants.", {});
  P("glomerulonephrite", "glomérulonéphrite", "nephro", "autoimmun", 2, "Inflammation des glomérules, avec sang et protéines dans les urines.", {});
  P("polykystose-renale", "polykystose rénale", "nephro", "genetique", 2, "Kystes multiples qui détruisent progressivement les deux reins.", {});
  P("hypertrophie-benigne-prostate", "hypertrophie bénigne de la prostate", "nephro", "degeneratif", 2, "Augmentation de volume de la prostate gênant la vidange de la vessie.", { alt: ["adénome de la prostate"] });
  P("prostatite", "prostatite", "nephro", "infectieux", 2, "Infection de la prostate, avec fièvre et douleurs en urinant.", {});
  P("torsion-cordon-spermatique", "torsion du cordon spermatique", "urgences", "mecanique", 2, "Testicule tordu sur son pédicule, urgence chirurgicale pour le sauver.", { alt: ["torsion testiculaire"] });
  P("varicocele", "varicocèle", "nephro", "vasculaire", 2, "Dilatation des veines du cordon spermatique, cause d'infertilité.", {});
  P("cryptorchidie", "cryptorchidie", "nephro", "congenital", 2, "Testicule non descendu dans la bourse à la naissance.", {});
  P("phimosis", "phimosis", "nephro", "congenital", 2, "Prépuce trop étroit, qui ne peut pas se rétracter sur le gland.", {});
  P("insuffisance-renale-aigue", "insuffisance rénale aiguë", "urgences", "fonctionnel", 2, "Chute brutale de la filtration par les reins, souvent réversible.", {});
  P("cancer-vessie", "cancer de la vessie", "onco", "tumoral", 2, "Tumeur maligne de la vessie, liée au tabac, révélée par du sang dans les urines.", {});
  P("cancer-rein", "cancer du rein", "onco", "tumoral", 2, "Tumeur maligne du rein, longtemps muette, découverte souvent par hasard.", {});

  /* ---------------- Gynecologie et obstetrique ---------------- */
  P("leiomyome-uterin", "léiomyome utérin", "gyneco", "tumoral", 2, "Tumeur bénigne du muscle de l'utérus, responsable de règles abondantes.", { alt: ["fibrome utérin", "fibrome"] });
  P("kyste-ovarien", "kyste ovarien", "gyneco", "fonctionnel", 2, "Poche liquidienne de l'ovaire, le plus souvent bénigne et transitoire.", {});
  P("pre-eclampsie", "pré-éclampsie", "gyneco", "vasculaire", 2, "Hypertension et protéines dans les urines après la vingtième semaine de grossesse.", { old: ["toxémie gravidique"] });
  P("grossesse-extra-uterine", "grossesse extra-utérine", "urgences", "mecanique", 2, "Embryon implanté hors de l'utérus, le plus souvent dans la trompe.", { alt: ["GEU"] });
  P("placenta-praevia", "placenta prævia", "gyneco", "mecanique", 2, "Organe nourricier du fœtus inséré trop bas, recouvrant le col, avec risque d'hémorragie.", {});
  P("salpingite", "salpingite", "gyneco", "infectieux", 2, "Infection des trompes utérines, pouvant laisser une stérilité.", {});
  P("mastite", "mastite", "gyneco", "infectieux", 2, "Infection du sein pendant l'allaitement, avec fièvre et placard rouge.", {});
  P("prolapsus-genital", "prolapsus génital", "gyneco", "mecanique", 2, "Descente des organes du petit bassin par relâchement du plancher pelvien.", { alt: ["descente d'organes"] });
  P("vaginose-bacterienne", "vaginose bactérienne", "gyneco", "infectieux", 2, "Déséquilibre de la flore vaginale, avec pertes malodorantes.", {});
  P("dysmenorrhee", "dysménorrhée", "gyneco", "fonctionnel", 2, "Règles douloureuses, isolées ou liées à une maladie de l'utérus.", {});
  P("cancer-ovaire", "cancer de l'ovaire", "onco", "tumoral", 2, "Tumeur maligne de l'ovaire, de diagnostic souvent tardif.", {});
  P("cancer-endometre", "cancer de l'endomètre", "onco", "tumoral", 2, "Tumeur maligne de la muqueuse utérine, révélée par des saignements après la ménopause.", {});

  /* ---------------- Rhumatologie et orthopedie ---------------- */
  P("polyarthrite-rhumatoide", "polyarthrite rhumatoïde", "rhumato", "autoimmun", 2, "Inflammation chronique et symétrique des petites articulations, qui les déforme.", {});
  P("goutte", "goutte", "rhumato", "metabolique", 2, "Crises très douloureuses dues à des cristaux d'acide urique, souvent au gros orteil.", {});
  P("spondylarthrite-ankylosante", "spondylarthrite ankylosante", "rhumato", "autoimmun", 2, "Inflammation du rachis et des sacro-iliaques, avec raideur matinale du dos.", {});
  P("lupus", "lupus érythémateux systémique", "immuno", "autoimmun", 2, "Maladie auto-immune générale, avec éruption du visage en aile de papillon.", { alt: ["lupus"] });
  P("fibromyalgie", "fibromyalgie", "rhumato", "fonctionnel", 2, "Douleurs diffuses chroniques avec fatigue et sommeil non réparateur.", {});
  P("bursite", "bursite", "rhumato", "inflammatoire", 2, "Inflammation d'une bourse séreuse, au coude ou au genou.", { alt: ["hygroma"] });
  P("epicondylite", "épicondylite", "rhumato", "mecanique", 2, "Souffrance des tendons extenseurs au coude, par gestes répétés.", { alt: ["tennis elbow"] });
  P("maladie-dupuytren", "maladie de Dupuytren", "rhumato", "genetique", 2, "Rétraction de l'aponévrose de la paume, qui fléchit les doigts.", {});
  P("hallux-valgus", "hallux valgus", "rhumato", "mecanique", 2, "Déviation du gros orteil vers les autres, avec saillie douloureuse.", { alt: ["oignon du pied"] });
  P("osteomyelite", "ostéomyélite", "rhumato", "infectieux", 2, "Infection de l'os et de sa moelle, souvent par voie sanguine chez l'enfant.", {});
  P("arthrite-septique", "arthrite septique", "urgences", "infectieux", 2, "Infection d'une articulation, chaude et impotente, à drainer en urgence.", {});
  P("rachitisme", "rachitisme", "nutrition", "carentiel", 2, "Os mal minéralisés chez l'enfant par manque de vitamine D.", {});
  P("osteomalacie", "ostéomalacie", "rhumato", "carentiel", 2, "Défaut de minéralisation de l'os chez l'adulte, par carence en vitamine D.", {});
  P("maladie-osseuse-paget", "maladie osseuse de Paget", "rhumato", "degeneratif", 2, "Remodelage osseux anarchique, avec os épaissi mais fragile.", {});
  P("rupture-coiffe-rotateurs", "rupture de la coiffe des rotateurs", "rhumato", "degeneratif", 2, "Déchirure des tendons de l'épaule, avec douleur et perte de force.", {});
  P("rupture-ligament-croise", "rupture du ligament croisé antérieur", "rhumato", "traumatique", 2, "Déchirure d'un ligament central du genou, fréquente au ski et au football.", {});

  /* ---------------- Dermatologie ---------------- */
  P("zona", "zona", "derm", "infectieux", 2, "Réveil du virus de la varicelle dans un ganglion, avec éruption douloureuse en bande.", {});
  P("impetigo", "impétigo", "derm", "infectieux", 2, "Infection superficielle de la peau chez l'enfant, avec croûtes couleur de miel.", {});
  P("erysipele", "érysipèle", "derm", "infectieux", 2, "Infection aiguë du derme par un streptocoque, placard rouge et fièvre.", {});
  P("rosacee", "rosacée", "derm", "vasculaire", 2, "Rougeurs permanentes du visage avec vaisseaux dilatés et papules.", { old: ["couperose"] });
  P("vitiligo", "vitiligo", "derm", "autoimmun", 2, "Taches blanches par destruction auto-immune des mélanocytes.", {});
  P("pelade", "pelade", "derm", "autoimmun", 2, "Chute de cheveux en plaques bien rondes, d'origine auto-immune.", { alt: ["alopécie areata"] });
  P("gale", "gale", "derm", "infectieux", 2, "Infestation par un acarien, avec démangeaisons nocturnes et sillons.", {});
  P("onychomycose", "onychomycose", "derm", "infectieux", 2, "Infection de l'ongle par un champignon, qui l'épaissit et le jaunit.", { alt: ["mycose des ongles"] });
  P("carcinome-basocellulaire", "carcinome basocellulaire", "onco", "tumoral", 2, "Cancer cutané le plus fréquent, d'évolution locale et sans métastase.", {});
  P("keratose-actinique", "kératose actinique", "derm", "toxique", 2, "Lésion rugueuse des zones exposées au soleil, pouvant dégénérer.", {});
  P("dermatite-seborrheique", "dermatite séborrhéique", "derm", "inflammatoire", 2, "Plaques rouges et squameuses des zones grasses du visage et du cuir chevelu.", {});
  P("escarre", "escarre", "derm", "mecanique", 2, "Nécrose de la peau par appui prolongé chez un patient immobilisé.", {});
  P("furoncle", "furoncle", "derm", "infectieux", 2, "Infection profonde d'un follicule pileux par un staphylocoque.", {});
  P("panaris", "panaris", "derm", "infectieux", 2, "Infection aiguë du pourtour de l'ongle, chaude et douloureuse.", {});

  /* ---------------- Ophtalmologie ---------------- */
  P("glaucome", "glaucome", "ophtalmo", "degeneratif", 2, "Destruction lente du nerf optique, souvent par pression intraoculaire élevée.", {});
  P("degenerescence-maculaire", "dégénérescence maculaire liée à l'âge", "ophtalmo", "degeneratif", 2, "Atteinte du centre de la rétine après 50 ans, avec perte de la vision centrale.", { alt: ["DMLA"] });
  P("retinopathie-diabetique", "rétinopathie diabétique", "ophtalmo", "metabolique", 2, "Atteinte des petits vaisseaux de la rétine par le diabète, grande cause de cécité.", {});
  P("decollement-retine", "décollement de rétine", "urgences", "mecanique", 2, "Rétine séparée de son support, avec voile noir et éclairs lumineux.", {});
  P("keratite", "kératite", "ophtalmo", "infectieux", 2, "Inflammation de la cornée, douloureuse et menaçant la vision.", {});
  P("uveite", "uvéite", "ophtalmo", "inflammatoire", 2, "Inflammation de l'uvée, souvent liée à une maladie générale.", {});
  P("syndrome-sec-oculaire", "syndrome sec oculaire", "ophtalmo", "fonctionnel", 2, "Larmes insuffisantes ou de mauvaise qualité, avec sensation de sable.", {});
  P("chalazion", "chalazion", "ophtalmo", "inflammatoire", 2, "Kyste inflammatoire d'une glande de la paupière, sans infection.", {});
  P("amblyopie", "amblyopie", "ophtalmo", "fonctionnel", 2, "Œil qui n'a pas appris à voir dans l'enfance, malgré une correction optique.", { alt: ["œil paresseux"] });
  P("nevrite-optique", "névrite optique", "ophtalmo", "autoimmun", 2, "Inflammation du nerf optique, avec baisse de vision et douleur aux mouvements.", {});

  /* ---------------- ORL et stomatologie ---------------- */
  P("maladie-meniere", "maladie de Menière", "orl", "fonctionnel", 2, "Crises de vertige avec acouphènes et surdité fluctuante, par excès d'endolymphe.", {});
  P("acouphenes", "acouphènes", "orl", "fonctionnel", 2, "Bruits perçus sans source extérieure, sifflements ou bourdonnements.", {});
  P("vertige-positionnel", "vertige positionnel paroxystique bénin", "orl", "mecanique", 2, "Crises brèves déclenchées par les changements de position, par cristaux déplacés.", { alt: ["VPPB"] });
  P("otite-seromuqueuse", "otite séromuqueuse", "orl", "inflammatoire", 2, "Liquide derrière le tympan sans infection aiguë, cause de surdité chez l'enfant.", {});
  P("otospongiose", "otospongiose", "orl", "genetique", 2, "Blocage progressif de l'étrier par de l'os néoformé, avec surdité de transmission.", {});
  P("polypose-nasosinusienne", "polypose nasosinusienne", "orl", "inflammatoire", 2, "Polypes inflammatoires des fosses nasales, avec nez bouché et perte d'odorat.", {});
  P("lithiase-salivaire", "lithiase salivaire", "orl", "metabolique", 2, "Calcul bloquant un conduit salivaire, avec gonflement au moment des repas.", {});
  P("cancer-larynx", "cancer du larynx", "onco", "tumoral", 2, "Tumeur maligne liée au tabac et à l'alcool, avec voix rauque persistante.", {});
  P("parodontite", "parodontite", "orl", "infectieux", 2, "Destruction du tissu de soutien de la dent, qui finit par se déchausser.", {});
  P("bruxisme", "bruxisme", "orl", "fonctionnel", 2, "Grincement ou serrement involontaire des dents, surtout la nuit.", {});

  /* ---------------- Hematologie ---------------- */
  P("anemie-ferriprive", "anémie ferriprive", "hemato", "carentiel", 2, "Manque de fer, première cause d'anémie, avec globules rouges petits et pâles.", {});
  P("maladie-biermer", "maladie de Biermer", "hemato", "autoimmun", 2, "Anémie par défaut d'absorption de la vitamine B12, d'origine auto-immune.", { alt: ["anémie pernicieuse"] });
  P("drepanocytose", "drépanocytose", "hemato", "genetique", 2, "Hémoglobine anormale déformant les globules rouges en faucille, avec crises douloureuses.", { alt: ["anémie falciforme"] });
  P("thalassemie", "thalassémie", "hemato", "genetique", 2, "Défaut de synthèse d'une chaîne de l'hémoglobine, avec anémie chronique.", {});
  P("myelome-multiple", "myélome multiple", "hemato", "tumoral", 2, "Prolifération de plasmocytes dans la moelle, avec douleurs osseuses et fractures.", { alt: ["maladie de Kahler"] });
  P("lymphome-hodgkinien", "lymphome hodgkinien", "hemato", "tumoral", 2, "Cancer du système lymphatique avec cellules de Reed-Sternberg, de bon pronostic.", { alt: ["maladie de Hodgkin"] });
  P("lymphome-non-hodgkinien", "lymphome non hodgkinien", "hemato", "tumoral", 2, "Groupe de cancers des lymphocytes, de gravité très variable.", {});
  P("purpura-thrombopenique", "purpura thrombopénique immunologique", "hemato", "autoimmun", 2, "Destruction auto-immune des plaquettes, avec petites taches rouges sur la peau.", { alt: ["PTI"] });
  P("maladie-willebrand", "maladie de Willebrand", "hemato", "genetique", 2, "Trouble héréditaire de la coagulation le plus fréquent, avec saignements prolongés.", {});
  P("hemochromatose", "hémochromatose", "hemato", "genetique", 2, "Absorption excessive de fer qui se dépose dans le foie, le cœur et le pancréas.", {});
  P("aplasie-medullaire", "aplasie médullaire", "hemato", "autoimmun", 2, "Moelle osseuse qui ne produit plus assez de cellules sanguines.", {});

  /* ---------------- Cancerologie ---------------- */
  P("cancer-estomac", "cancer de l'estomac", "onco", "tumoral", 2, "Tumeur maligne gastrique, favorisée par Helicobacter pylori.", {});
  P("cancer-pancreas", "cancer du pancréas", "onco", "tumoral", 2, "Tumeur maligne de pronostic sévère, souvent révélée par une jaunisse indolore.", {});
  P("carcinome-hepatocellulaire", "carcinome hépatocellulaire", "onco", "tumoral", 2, "Cancer du foie survenant le plus souvent sur une cirrhose.", { alt: ["cancer du foie"] });
  P("cancer-oesophage", "cancer de l'œsophage", "onco", "tumoral", 2, "Tumeur maligne liée au tabac, à l'alcool ou au reflux, avec blocage des aliments.", {});
  P("cancer-testicule", "cancer du testicule", "onco", "tumoral", 2, "Tumeur maligne de l'homme jeune, de très bon pronostic si elle est traitée tôt.", {});
  P("mesotheliome", "mésothéliome pleural", "onco", "tumoral", 2, "Cancer de la plèvre dû à l'amiante, de pronostic sombre.", {});
  P("sarcome", "sarcome", "onco", "tumoral", 2, "Cancer développé aux dépens des tissus de soutien, os ou muscles.", {});
  P("metastase", "métastase", "onco", "tumoral", 2, "Colonie d'une tumeur maligne installée à distance de son organe d'origine.", {});

  /* ---------------- Maladies infectieuses ---------------- */
  P("mononucleose", "mononucléose infectieuse", "infectio", "infectieux", 2, "Infection par le virus d'Epstein-Barr, avec angine, ganglions et grande fatigue.", { alt: ["maladie du baiser"] });
  P("borreliose-lyme", "borréliose de Lyme", "infectio", "infectieux", 2, "Infection transmise par la tique, débutant par une plaque rouge qui s'étend.", { alt: ["maladie de Lyme"] });
  P("toxoplasmose", "toxoplasmose", "infectio", "infectieux", 2, "Parasitose bénigne sauf chez la femme enceinte et l'immunodéprimé.", {});
  P("infection-cytomegalovirus", "infection à cytomégalovirus", "infectio", "infectieux", 2, "Virose très fréquente, grave chez le fœtus et l'immunodéprimé.", { alt: ["CMV"] });
  P("chlamydiose", "infection à Chlamydia trachomatis", "infectio", "infectieux", 2, "Maladie sexuellement transmissible souvent muette, cause de stérilité.", { alt: ["chlamydia"] });
  P("gonococcie", "gonococcie", "infectio", "infectieux", 2, "Maladie sexuellement transmissible avec écoulement purulent et brûlures.", { alt: ["blennorragie"], old: ["chaude-pisse"] });
  P("candidose", "candidose", "infectio", "infectieux", 2, "Infection par une levure du genre Candida, de la bouche ou du vagin.", { alt: ["muguet"] });
  P("coqueluche", "coqueluche", "infectio", "infectieux", 2, "Toux violente en quintes suivies d'une reprise bruyante, grave chez le nourrisson.", {});
  P("scarlatine", "scarlatine", "infectio", "infectieux", 2, "Angine à streptocoque avec éruption rouge granitée et langue framboisée.", {});
  P("oreillons", "oreillons", "infectio", "infectieux", 2, "Infection virale des glandes parotides, pouvant atteindre les testicules.", {});
  P("rubeole", "rubéole", "infectio", "infectieux", 2, "Éruption virale bénigne, mais très dangereuse pour le fœtus.", {});
  P("diphterie", "diphtérie", "infectio", "infectieux", 2, "Angine à fausses membranes avec toxine cardiaque, évitée par le vaccin.", {});
  P("poliomyelite", "poliomyélite", "infectio", "infectieux", 2, "Virose détruisant les motoneurones, avec paralysies définitives.", {});
  P("legionellose", "légionellose", "infectio", "infectieux", 2, "Pneumonie grave contractée en inhalant de l'eau contaminée en aérosol.", { alt: ["maladie du légionnaire"] });
  P("leptospirose", "leptospirose", "infectio", "infectieux", 2, "Infection transmise par l'urine des rongeurs, avec fièvre, jaunisse et atteinte du rein.", { alt: ["maladie des rats"] });
  P("brucellose", "brucellose", "infectio", "infectieux", 2, "Infection transmise par les animaux d'élevage, avec fièvre ondulante.", { alt: ["fièvre de Malte"] });
  P("dengue", "dengue", "infectio", "infectieux", 2, "Fièvre tropicale transmise par le moustique tigre, avec douleurs intenses.", {});
  P("chikungunya", "chikungunya", "infectio", "infectieux", 2, "Arbovirose avec fièvre et douleurs articulaires parfois persistantes.", {});
  P("fievre-jaune", "fièvre jaune", "infectio", "infectieux", 2, "Arbovirose africaine et sud-américaine avec jaunisse, évitable par le vaccin.", {});
  P("fievre-typhoide", "fièvre typhoïde", "infectio", "infectieux", 2, "Infection par Salmonella typhi, avec fièvre en plateau et troubles digestifs.", {});
  P("sepsis", "sepsis", "urgences", "infectieux", 2, "Réponse généralisée et dérégulée de l'organisme à une infection.", { old: ["septicémie"] });
  P("amibiase", "amibiase", "infectio", "infectieux", 2, "Parasitose intestinale tropicale, avec diarrhée glairosanglante et abcès du foie.", {});
  P("giardiase", "giardiase", "infectio", "infectieux", 2, "Parasitose de l'intestin grêle par Giardia, avec diarrhée chronique.", {});
  P("oxyurose", "oxyurose", "infectio", "infectieux", 2, "Petits vers intestinaux de l'enfant, responsables de démangeaisons anales nocturnes.", {});
  P("teniase", "téniase", "infectio", "infectieux", 2, "Parasitose par un ver plat contracté en mangeant de la viande mal cuite.", { alt: ["ver solitaire"] });
  P("ascaridiose", "ascaridiose", "infectio", "infectieux", 2, "Parasitose par un ver rond intestinal, fréquente en zone tropicale.", {});
  P("schistosomiase", "schistosomiase", "infectio", "infectieux", 2, "Parasitose contractée dans les eaux douces tropicales, atteignant vessie ou intestin.", { alt: ["bilharziose"] });
  P("leishmaniose", "leishmaniose", "infectio", "infectieux", 2, "Parasitose transmise par le phlébotome, cutanée ou viscérale.", {});
  P("trypanosomiase-africaine", "trypanosomiase africaine", "infectio", "infectieux", 2, "Parasitose transmise par la mouche tsé-tsé, avec somnolence puis coma.", { alt: ["maladie du sommeil"] });
  P("aspergillose", "aspergillose", "infectio", "infectieux", 2, "Infection par un champignon filamenteux, grave chez l'immunodéprimé.", {});
  P("grippe-aviaire", "grippe aviaire", "infectio", "infectieux", 2, "Virose des oiseaux pouvant franchir la barrière d'espèce.", {});
  P("variole", "variole", "infectio", "infectieux", 2, "Maladie éruptive mortelle, première maladie éradiquée par la vaccination.", {});

  /* ---------------- Immunologie et allergies ---------------- */
  P("anaphylaxie", "anaphylaxie", "urgences", "allergique", 2, "Réaction allergique généralisée et brutale, avec chute de tension.", { alt: ["choc anaphylactique"] });
  P("angioedeme", "angiœdème", "immuno", "allergique", 2, "Gonflement profond du visage et de la gorge, menaçant la respiration.", { alt: ["œdème de Quincke"] });
  P("deficit-immunitaire", "déficit immunitaire", "immuno", "genetique", 2, "Défenses insuffisantes, avec infections répétées et inhabituelles.", {});

  /* ---------------- Maladies genetiques ---------------- */
  P("syndrome-turner", "syndrome de Turner", "genetique", "genetique", 2, "Fille avec un seul chromosome X : petite taille et ovaires non fonctionnels.", {});
  P("syndrome-klinefelter", "syndrome de Klinefelter", "genetique", "genetique", 2, "Garçon avec un chromosome X surnuméraire : grande taille et infertilité.", {});
  P("syndrome-x-fragile", "syndrome de l'X fragile", "genetique", "genetique", 2, "Première cause héréditaire de déficience intellectuelle, liée au chromosome X.", {});
  P("syndrome-marfan", "syndrome de Marfan", "genetique", "genetique", 2, "Anomalie du tissu conjonctif : grande taille, doigts longs et risque aortique.", {});
  P("neurofibromatose-1", "neurofibromatose de type 1", "genetique", "genetique", 2, "Taches café au lait et tumeurs bénignes des nerfs.", { alt: ["maladie de Recklinghausen"] });
  P("achondroplasie", "achondroplasie", "genetique", "genetique", 2, "Nanisme aux membres courts par anomalie de la croissance du cartilage.", {});
  P("phenylcetonurie", "phénylcétonurie", "genetique", "metabolique", 2, "Accumulation toxique d'un acide aminé, dépistée à la naissance.", {});

  /* ---------------- Nutrition et carences ---------------- */
  P("carence-martiale", "carence martiale", "nutrition", "carentiel", 2, "Réserves en fer épuisées, avec fatigue avant même l'anémie.", { alt: ["carence en fer"] });
  P("carence-vitamine-d", "carence en vitamine D", "nutrition", "carentiel", 2, "Manque lié au faible ensoleillement, avec os fragilisés et douleurs.", {});
  P("scorbut", "scorbut", "nutrition", "carentiel", 2, "Carence en vitamine C, avec gencives qui saignent et hématomes.", {});
  P("beriberi", "béribéri", "nutrition", "carentiel", 2, "Carence en vitamine B1, avec atteinte des nerfs ou du cœur.", {});
  P("pellagre", "pellagre", "nutrition", "carentiel", 2, "Carence en vitamine PP, associant dermatite, diarrhée et démence.", {});
  P("kwashiorkor", "kwashiorkor", "nutrition", "carentiel", 2, "Dénutrition par manque de protéines, avec œdèmes et gros ventre.", {});

  /* ===================== Difficulte 3 : difficiles ===================== */

  /* ---------------- Cardiologie ---------------- */
  P("cardiomyopathie-hypertrophique", "cardiomyopathie hypertrophique", "cardio", "genetique", 3, "Épaississement du muscle cardiaque, première cause de mort subite du sportif jeune.", {});
  P("cardiomyopathie-dilatee", "cardiomyopathie dilatée", "cardio", "degeneratif", 3, "Ventricule gauche élargi et affaibli, évoluant vers l'insuffisance cardiaque.", {});
  P("syndrome-brugada", "syndrome de Brugada", "cardio", "genetique", 3, "Anomalie des canaux sodiques exposant à la mort subite par trouble du rythme.", {});
  P("syndrome-qt-long", "syndrome du QT long", "cardio", "genetique", 3, "Repolarisation cardiaque allongée, avec risque de syncope et de mort subite.", {});
  P("syndrome-wolff-parkinson-white", "syndrome de Wolff-Parkinson-White", "cardio", "congenital", 3, "Faisceau électrique accessoire entre atrium et ventricule, cause de tachycardies.", { alt: ["WPW"] });
  P("syndrome-takotsubo", "syndrome de Takotsubo", "cardio", "fonctionnel", 3, "Sidération du ventricule gauche après un stress intense, imitant un infarctus.", { alt: ["syndrome du cœur brisé"] });
  P("dissection-aortique", "dissection aortique", "urgences", "vasculaire", 3, "Déchirure de la paroi de l'aorte, avec douleur transfixiante, urgence vitale.", {});
  P("tetralogie-fallot", "tétralogie de Fallot", "cardio", "congenital", 3, "Cardiopathie congénitale à quatre anomalies, responsable d'un nourrisson bleu.", {});
  P("maladie-ebstein", "maladie d'Ebstein", "cardio", "congenital", 3, "Valve tricuspide implantée trop bas dans le ventricule droit.", {});
  P("syndrome-eisenmenger", "syndrome d'Eisenmenger", "cardio", "congenital", 3, "Inversion d'un shunt cardiaque après installation d'une hypertension pulmonaire.", {});
  P("hypertension-pulmonaire", "hypertension pulmonaire", "pneumo", "vasculaire", 3, "Pression élevée dans les artères du poumon, avec essoufflement et cœur droit en échec.", {});

  /* ---------------- Pneumologie ---------------- */
  P("sarcoidose", "sarcoïdose", "pneumo", "inflammatoire", 3, "Granulomes sans nécrose dans les poumons et les ganglions, de cause inconnue.", { alt: ["maladie de Besnier-Boeck-Schaumann"] });
  P("dilatation-bronches", "dilatation des bronches", "pneumo", "inflammatoire", 3, "Bronches élargies de façon irréversible, avec expectoration abondante.", { alt: ["bronchectasies"] });
  P("pneumoconiose", "pneumoconiose", "pneumo", "toxique", 3, "Maladie du poumon due à l'inhalation chronique de poussières minérales.", {});
  P("pneumopathie-hypersensibilite", "pneumopathie d'hypersensibilité", "pneumo", "allergique", 3, "Inflammation des alvéoles par inhalation répétée d'antigènes organiques.", { alt: ["poumon de fermier", "alvéolite allergique extrinsèque"] });
  P("deficit-alpha1-antitrypsine", "déficit en alpha-1-antitrypsine", "pneumo", "genetique", 3, "Anomalie enzymatique héréditaire donnant un emphysème précoce et une atteinte du foie.", {});

  /* ---------------- Gastro-enterologie et hepatologie ---------------- */
  P("achalasie", "achalasie", "gastro", "fonctionnel", 3, "Défaut de relaxation du sphincter inférieur de l'œsophage, avec blocage des aliments.", { alt: ["mégaœsophage"] });
  P("syndrome-zollinger-ellison", "syndrome de Zollinger-Ellison", "gastro", "tumoral", 3, "Tumeur sécrétant de la gastrine, avec ulcères multiples et rebelles.", {});
  P("maladie-whipple", "maladie de Whipple", "gastro", "infectieux", 3, "Infection rare par Tropheryma whipplei, avec diarrhée, arthrites et amaigrissement.", {});
  P("maladie-hirschsprung", "maladie de Hirschsprung", "gastro", "congenital", 3, "Absence de ganglions nerveux sur un segment du côlon, avec occlusion du nouveau-né.", { alt: ["mégacôlon congénital"] });
  P("diverticule-meckel", "diverticule de Meckel", "gastro", "congenital", 3, "Reliquat du canal vitellin sur l'iléon, pouvant saigner ou s'enflammer.", {});
  P("syndrome-budd-chiari", "syndrome de Budd-Chiari", "gastro", "vasculaire", 3, "Obstruction des veines sus-hépatiques, avec gros foie douloureux et ascite.", {});
  P("cholangite-biliaire-primitive", "cholangite biliaire primitive", "gastro", "autoimmun", 3, "Destruction auto-immune des petits canaux biliaires, avec démangeaisons.", { old: ["cirrhose biliaire primitive"] });
  P("cholangite-sclerosante", "cholangite sclérosante primitive", "gastro", "autoimmun", 3, "Fibrose des voies biliaires, souvent associée à une rectocolite hémorragique.", {});
  P("maladie-wilson", "maladie de Wilson", "gastro", "genetique", 3, "Accumulation de cuivre dans le foie et le cerveau, avec un anneau coloré sur la cornée.", {});
  P("syndrome-gilbert", "syndrome de Gilbert", "gastro", "genetique", 3, "Jaunisse intermittente bénigne par déficit partiel d'une enzyme du foie.", { alt: ["maladie de Gilbert"] });
  P("atresie-voies-biliaires", "atrésie des voies biliaires", "gastro", "congenital", 3, "Canaux biliaires absents ou obstrués chez le nouveau-né, avec jaunisse persistante.", {});
  P("invagination-intestinale", "invagination intestinale aiguë", "urgences", "mecanique", 3, "Segment d'intestin télescopé dans le suivant, chez le nourrisson.", {});
  P("ischemie-mesenterique", "ischémie mésentérique", "urgences", "vasculaire", 3, "Interruption de la vascularisation de l'intestin, avec douleur intense et nécrose.", {});
  P("gastroparesie", "gastroparésie", "gastro", "fonctionnel", 3, "Vidange de l'estomac trop lente, souvent par atteinte nerveuse du diabète.", {});

  /* ---------------- Endocrinologie et metabolisme ---------------- */
  P("pheochromocytome", "phéochromocytome", "endo", "tumoral", 3, "Tumeur de la médullosurrénale sécrétant des catécholamines, avec poussées de tension.", {});
  P("hyperaldosteronisme-primaire", "hyperaldostéronisme primaire", "endo", "tumoral", 3, "Excès d'aldostérone, avec hypertension et potassium bas.", { alt: ["syndrome de Conn"] });
  P("neoplasie-endocrinienne-multiple", "néoplasie endocrinienne multiple", "endo", "genetique", 3, "Tumeurs héréditaires touchant plusieurs glandes endocrines.", { alt: ["NEM"] });
  P("syndrome-sheehan", "syndrome de Sheehan", "endo", "vasculaire", 3, "Nécrose de l'hypophyse après une hémorragie de la délivrance.", {});
  P("syndrome-kallmann", "syndrome de Kallmann", "endo", "genetique", 3, "Absence de puberté associée à une perte de l'odorat.", {});
  P("insulinome", "insulinome", "endo", "tumoral", 3, "Tumeur du pancréas sécrétant de l'insuline, avec malaises à jeun.", {});
  P("tumeur-carcinoide", "tumeur neuroendocrine carcinoïde", "onco", "tumoral", 3, "Tumeur sécrétant de la sérotonine, avec bouffées vasomotrices et diarrhée.", { alt: ["syndrome carcinoïde"] });
  P("hyperplasie-congenitale-surrenales", "hyperplasie congénitale des surrénales", "endo", "genetique", 3, "Déficit enzymatique surrénalien avec virilisation et perte de sel.", {});
  P("porphyrie-aigue", "porphyrie aiguë intermittente", "endo", "genetique", 3, "Crises de douleurs abdominales et de troubles neuropsychiques, urines foncées.", { alt: ["porphyrie"] });

  /* ---------------- Neurologie ---------------- */
  P("maladie-huntington", "maladie de Huntington", "neuro", "genetique", 3, "Mouvements involontaires brusques et démence, de transmission dominante.", { old: ["chorée de Huntington"] });
  P("maladie-creutzfeldt-jakob", "maladie de Creutzfeldt-Jakob", "neuro", "degeneratif", 3, "Encéphalopathie spongiforme à prion, d'évolution rapidement mortelle.", {});
  P("charcot-marie-tooth", "maladie de Charcot-Marie-Tooth", "neuro", "genetique", 3, "Neuropathie héréditaire avec pieds creux et fonte musculaire des jambes.", {});
  P("ataxie-friedreich", "ataxie de Friedreich", "neuro", "genetique", 3, "Trouble héréditaire de l'équilibre chez l'enfant, avec atteinte du cœur.", {});
  P("syndrome-lambert-eaton", "syndrome de Lambert-Eaton", "neuro", "autoimmun", 3, "Faiblesse musculaire paranéoplasique par atteinte avant la synapse.", {});
  P("neuromyelite-optique", "neuromyélite optique", "neuro", "autoimmun", 3, "Atteinte sévère des nerfs optiques et de la moelle, distincte de la sclérose en plaques.", { alt: ["maladie de Devic"] });
  P("syndrome-miller-fisher", "syndrome de Miller Fisher", "neuro", "autoimmun", 3, "Variante du Guillain-Barré associant paralysie oculaire, ataxie et aréflexie.", {});
  P("paralysie-supranucleaire-progressive", "paralysie supranucléaire progressive", "neuro", "degeneratif", 3, "Syndrome parkinsonien avec chutes précoces et blocage du regard vertical.", {});
  P("atrophie-multisystematisee", "atrophie multisystématisée", "neuro", "degeneratif", 3, "Syndrome parkinsonien avec troubles végétatifs marqués, peu sensible à la dopamine.", {});
  P("demence-corps-lewy", "démence à corps de Lewy", "neuro", "degeneratif", 3, "Trouble cognitif fluctuant avec hallucinations visuelles et signes parkinsoniens.", {});
  P("demence-frontotemporale", "démence frontotemporale", "neuro", "degeneratif", 3, "Atteinte cognitive du sujet jeune, débutant par des troubles du comportement.", { old: ["maladie de Pick"] });
  P("syringomyelie", "syringomyélie", "neuro", "congenital", 3, "Cavité liquidienne dans la moelle, avec perte de la sensibilité à la douleur.", {});
  P("malformation-chiari", "malformation de Chiari", "neuro", "congenital", 3, "Descente des tonsilles du cervelet dans le trou occipital.", {});
  P("encephalopathie-wernicke", "encéphalopathie de Wernicke", "neuro", "carentiel", 3, "Confusion, ataxie et paralysie oculaire par carence aiguë en vitamine B1.", {});
  P("syndrome-korsakoff", "syndrome de Korsakoff", "neuro", "carentiel", 3, "Amnésie des faits nouveaux avec fabulations, séquelle d'une carence en vitamine B1.", {});
  P("syndrome-melas", "syndrome MELAS", "neuro", "genetique", 3, "Maladie mitochondriale avec encéphalopathie, acidose lactique et pseudo-AVC.", {});
  P("hypertension-intracranienne-idiopathique", "hypertension intracrânienne idiopathique", "neuro", "fonctionnel", 3, "Pression élevée dans le crâne sans tumeur, avec œdème de la papille optique.", {});

  /* ---------------- Psychiatrie ---------------- */
  P("syndrome-munchausen", "syndrome de Münchhausen", "psy", "psychique", 3, "Simulation volontaire de maladies pour obtenir des soins et de l'attention.", {});
  P("syndrome-capgras", "syndrome de Capgras", "psy", "psychique", 3, "Conviction délirante qu'un proche a été remplacé par un sosie.", {});
  P("syndrome-cotard", "syndrome de Cotard", "psy", "psychique", 3, "Délire de négation d'organes ou d'immortalité, au cours de mélancolies graves.", {});
  P("catatonie", "catatonie", "psy", "psychique", 3, "Immobilité, mutisme et rigidité avec maintien des attitudes imposées.", {});
  P("trouble-dissociatif-identite", "trouble dissociatif de l'identité", "psy", "psychique", 3, "Coexistence de plusieurs états d'identité chez une même personne.", { old: ["personnalité multiple"] });
  P("syndrome-diogene", "syndrome de Diogène", "psy", "psychique", 3, "Négligence extrême de l'hygiène et accumulation compulsive d'objets.", {});

  /* ---------------- Nephrologie et urologie ---------------- */
  P("syndrome-goodpasture", "syndrome de Goodpasture", "nephro", "autoimmun", 3, "Anticorps contre la membrane basale, avec atteinte du rein et du poumon.", {});
  P("syndrome-alport", "syndrome d'Alport", "nephro", "genetique", 3, "Néphropathie héréditaire associée à une surdité et à des anomalies oculaires.", {});
  P("nephropathie-iga", "néphropathie à IgA", "nephro", "autoimmun", 3, "Dépôts d'immunoglobulines A dans les glomérules, première cause de glomérulonéphrite.", { alt: ["maladie de Berger"] });
  P("syndrome-hemolytique-uremique", "syndrome hémolytique et urémique", "nephro", "infectieux", 3, "Anémie, chute des plaquettes et atteinte du rein après une diarrhée à E. coli.", { alt: ["SHU"] });
  P("acidose-tubulaire-renale", "acidose tubulaire rénale", "nephro", "genetique", 3, "Défaut d'acidification des urines par le tubule, avec sang trop acide.", {});
  P("syndrome-fanconi-renal", "syndrome de Fanconi rénal", "nephro", "genetique", 3, "Fuite urinaire globale du tubule proximal : glucose, acides aminés et phosphate.", {});
  P("cystite-interstitielle", "cystite interstitielle", "nephro", "inflammatoire", 3, "Douleurs vésicales chroniques avec urines stériles, d'origine mal connue.", { alt: ["syndrome de la vessie douloureuse"] });

  /* ---------------- Maladies auto-immunes et systemiques ---------------- */
  P("syndrome-sjogren", "syndrome de Sjögren", "immuno", "autoimmun", 3, "Destruction auto-immune des glandes lacrymales et salivaires : bouche et yeux secs.", { old: ["syndrome de Gougerot-Sjögren"] });
  P("sclerodermie-systemique", "sclérodermie systémique", "immuno", "autoimmun", 3, "Fibrose de la peau et des organes, avec phénomène de Raynaud sévère.", {});
  P("dermatomyosite", "dermatomyosite", "immuno", "autoimmun", 3, "Inflammation des muscles et de la peau, avec éruption violine des paupières.", {});
  P("polymyosite", "polymyosite", "immuno", "autoimmun", 3, "Inflammation auto-immune des muscles proches du tronc, sans atteinte de la peau.", {});
  P("granulomatose-polyangeite", "granulomatose avec polyangéite", "immuno", "autoimmun", 3, "Vascularite des petits vaisseaux touchant la sphère ORL, les poumons et les reins.", { old: ["maladie de Wegener"] });
  P("granulomatose-eosinophilique", "granulomatose éosinophilique avec polyangéite", "immuno", "autoimmun", 3, "Vascularite associée à un asthme et à un excès d'éosinophiles.", { old: ["syndrome de Churg-Strauss"] });
  P("arterite-cellules-geantes", "artérite à cellules géantes", "immuno", "autoimmun", 3, "Vascularite des artères temporales du sujet âgé, menaçant la vision.", { alt: ["maladie de Horton"] });
  P("arterite-takayasu", "artérite de Takayasu", "immuno", "autoimmun", 3, "Vascularite de l'aorte et de ses branches chez la femme jeune, avec pouls abolis.", { alt: ["maladie des femmes sans pouls"] });
  P("maladie-behcet", "maladie de Behçet", "immuno", "inflammatoire", 3, "Aphtes buccaux et génitaux récidivants avec uvéite et atteinte vasculaire.", {});
  P("periarterite-noueuse", "périartérite noueuse", "immuno", "autoimmun", 3, "Vascularite nécrosante des artères de moyen calibre.", {});
  P("maladie-kawasaki", "maladie de Kawasaki", "immuno", "inflammatoire", 3, "Vascularite du jeune enfant avec fièvre prolongée et anévrismes des coronaires.", {});
  P("maladie-still", "maladie de Still", "immuno", "inflammatoire", 3, "Fièvre en pics, éruption fugace et arthrites, chez l'enfant ou l'adulte jeune.", {});
  P("amylose", "amylose", "immuno", "metabolique", 3, "Dépôts de protéines anormales en feuillets plissés dans les organes.", {});
  P("syndrome-antiphospholipides", "syndrome des antiphospholipides", "immuno", "autoimmun", 3, "Anticorps favorisant les thromboses et les fausses couches à répétition.", { alt: ["SAPL"] });
  P("connectivite-mixte", "connectivite mixte", "immuno", "autoimmun", 3, "Chevauchement de lupus, de sclérodermie et de myosite.", { alt: ["syndrome de Sharp"] });

  /* ---------------- Dermatologie ---------------- */
  P("pemphigus-vulgaire", "pemphigus vulgaire", "derm", "autoimmun", 3, "Bulles fragiles de la peau et des muqueuses par rupture des jonctions entre kératinocytes.", {});
  P("pemphigoide-bulleuse", "pemphigoïde bulleuse", "derm", "autoimmun", 3, "Grosses bulles tendues du sujet âgé, par décollement sous l'épiderme.", {});
  P("syndrome-stevens-johnson", "syndrome de Stevens-Johnson", "urgences", "toxique", 3, "Décollement cutané et atteinte des muqueuses, réaction grave à un médicament.", {});
  P("necrolyse-epidermique-toxique", "nécrolyse épidermique toxique", "urgences", "toxique", 3, "Forme la plus étendue de décollement de la peau après un médicament.", { alt: ["syndrome de Lyell"] });
  P("dermatite-herpetiforme", "dermatite herpétiforme", "derm", "autoimmun", 3, "Éruption bulleuse très prurigineuse associée à la maladie cœliaque.", {});
  P("epidermolyse-bulleuse", "épidermolyse bulleuse héréditaire", "derm", "genetique", 3, "Peau extrêmement fragile qui se décolle au moindre frottement.", { alt: ["enfants papillons"] });
  P("hidradenite-suppuree", "hidradénite suppurée", "derm", "inflammatoire", 3, "Nodules et abcès récidivants des plis, avec fistules.", { alt: ["maladie de Verneuil"] });
  P("lichen-plan", "lichen plan", "derm", "autoimmun", 3, "Papules violines prurigineuses avec stries blanchâtres, cutanées ou buccales.", {});
  P("mycosis-fongoide", "mycosis fongoïde", "onco", "tumoral", 3, "Lymphome cutané d'évolution lente, débutant par des plaques.", {});
  P("sarcome-kaposi", "sarcome de Kaposi", "onco", "tumoral", 3, "Tumeur vasculaire liée à un herpèsvirus, fréquente au cours du sida.", {});
  P("xeroderma-pigmentosum", "xeroderma pigmentosum", "genetique", "genetique", 3, "Incapacité à réparer les lésions de l'ADN par les UV, avec cancers précoces.", { alt: ["enfants de la lune"] });

  /* ---------------- Ophtalmologie ---------------- */
  P("retinopathie-pigmentaire", "rétinopathie pigmentaire", "ophtalmo", "genetique", 3, "Dégénérescence héréditaire des photorécepteurs, avec cécité nocturne puis vision en tunnel.", { alt: ["rétinite pigmentaire"] });
  P("keratocone", "kératocône", "ophtalmo", "degeneratif", 3, "Cornée qui s'amincit et se déforme en cône, avec vision très déformée.", {});
  P("maladie-stargardt", "maladie de Stargardt", "ophtalmo", "genetique", 3, "Atteinte héréditaire du centre de la rétine chez l'enfant et l'adulte jeune.", {});
  P("neuropathie-optique-leber", "neuropathie optique de Leber", "ophtalmo", "genetique", 3, "Perte brutale de la vision centrale par atteinte mitochondriale, chez l'homme jeune.", {});
  P("dystrophie-fuchs", "dystrophie cornéenne de Fuchs", "ophtalmo", "degeneratif", 3, "Perte des cellules de l'endothélium, avec cornée qui gonfle le matin.", {});
  P("occlusion-veine-centrale-retine", "occlusion de la veine centrale de la rétine", "ophtalmo", "vasculaire", 3, "Thrombose veineuse du fond d'œil, avec baisse de vision brutale et indolore.", {});
  P("syndrome-usher", "syndrome d'Usher", "genetique", "genetique", 3, "Association héréditaire d'une surdité et d'une atteinte pigmentaire de la rétine.", {});

  /* ---------------- ORL ---------------- */
  P("cholesteatome", "cholestéatome", "orl", "mecanique", 3, "Peau piégée dans l'oreille moyenne, qui érode les osselets et l'os.", {});
  P("schwannome-vestibulaire", "schwannome vestibulaire", "orl", "tumoral", 3, "Tumeur bénigne du nerf de l'équilibre, avec surdité d'un seul côté.", { old: ["neurinome de l'acoustique"] });
  P("paralysie-corde-vocale", "paralysie d'une corde vocale", "orl", "mecanique", 3, "Immobilité d'une corde vocale par atteinte du nerf laryngé récurrent.", {});
  P("angine-ludwig", "angine de Ludwig", "urgences", "infectieux", 3, "Cellulite du plancher de la bouche d'origine dentaire, menaçant les voies aériennes.", {});

  /* ---------------- Hematologie ---------------- */
  P("macroglobulinemie-waldenstrom", "macroglobulinémie de Waldenström", "hemato", "tumoral", 3, "Lymphome sécrétant une immunoglobuline M, qui épaissit le sang.", {});
  P("polyglobulie-vaquez", "polyglobulie de Vaquez", "hemato", "tumoral", 3, "Production excessive de globules rouges par la moelle, avec risque de thrombose.", { alt: ["maladie de Vaquez"] });
  P("thrombocytemie-essentielle", "thrombocytémie essentielle", "hemato", "tumoral", 3, "Excès durable de plaquettes par maladie de la moelle.", {});
  P("myelofibrose", "myélofibrose primitive", "hemato", "tumoral", 3, "Fibrose de la moelle osseuse avec grosse rate et anémie.", {});
  P("hemoglobinurie-paroxystique-nocturne", "hémoglobinurie paroxystique nocturne", "hemato", "genetique", 3, "Destruction des globules rouges par le complément, avec urines foncées le matin.", {});
  P("deficit-g6pd", "déficit en G6PD", "hemato", "genetique", 3, "Globules rouges fragiles détruits par certains aliments ou médicaments.", { alt: ["favisme"] });
  P("coagulation-intravasculaire-disseminee", "coagulation intravasculaire disséminée", "urgences", "vasculaire", 3, "Activation généralisée de l'hémostase, qui épuise les facteurs et fait saigner.", { alt: ["CIVD"] });
  P("purpura-thrombotique-thrombocytopenique", "purpura thrombotique thrombocytopénique", "hemato", "autoimmun", 3, "Microthromboses diffuses par déficit en ADAMTS13, urgence hématologique.", { alt: ["syndrome de Moschcowitz"] });
  P("anemie-fanconi", "anémie de Fanconi", "hemato", "genetique", 3, "Insuffisance héréditaire de la moelle avec malformations et risque de leucémie.", {});
  P("histiocytose-langerhansienne", "histiocytose langerhansienne", "hemato", "tumoral", 3, "Prolifération de cellules de Langerhans atteignant os, peau et poumons.", {});

  /* ---------------- Maladies genetiques et metaboliques ---------------- */
  P("maladie-gaucher", "maladie de Gaucher", "genetique", "genetique", 3, "Surcharge en glucocérébrosides, avec grosse rate et atteinte des os.", {});
  P("maladie-fabry", "maladie de Fabry", "genetique", "genetique", 3, "Surcharge lysosomale liée à l'X, avec douleurs des extrémités et atteinte du rein.", {});
  P("maladie-niemann-pick", "maladie de Niemann-Pick", "genetique", "genetique", 3, "Surcharge en sphingomyéline, avec atteinte neurologique et viscérale.", {});
  P("maladie-tay-sachs", "maladie de Tay-Sachs", "genetique", "genetique", 3, "Surcharge en gangliosides, avec régression neurologique du nourrisson.", {});
  P("maladie-pompe", "maladie de Pompe", "genetique", "genetique", 3, "Surcharge en glycogène, avec atteinte du muscle et du cœur.", {});
  P("mucopolysaccharidose", "mucopolysaccharidose", "genetique", "genetique", 3, "Surcharge en glycosaminoglycanes, avec traits épaissis et raideurs.", { alt: ["maladie de Hurler"] });
  P("galactosemie", "galactosémie", "genetique", "metabolique", 3, "Incapacité à métaboliser le sucre du lait, grave dès les premières tétées.", {});
  P("leucinose", "leucinose", "genetique", "metabolique", 3, "Trouble des acides aminés ramifiés, avec urines à odeur de sirop d'érable.", {});
  P("homocystinurie", "homocystinurie", "genetique", "metabolique", 3, "Accumulation d'homocystéine, avec thromboses et luxation du cristallin.", {});
  P("syndrome-ehlers-danlos", "syndrome d'Ehlers-Danlos", "genetique", "genetique", 3, "Hyperlaxité de la peau et des articulations, avec fragilité des tissus.", {});
  P("osteogenese-imparfaite", "ostéogenèse imparfaite", "genetique", "genetique", 3, "Os extrêmement fragiles avec sclères bleutées.", { alt: ["maladie des os de verre"] });
  P("syndrome-prader-willi", "syndrome de Prader-Willi", "genetique", "genetique", 3, "Hypotonie du nourrisson puis faim insatiable et obésité, par anomalie du chromosome 15.", {});
  P("syndrome-angelman", "syndrome d'Angelman", "genetique", "genetique", 3, "Déficience intellectuelle avec rires fréquents et ataxie, même région chromosomique.", {});
  P("syndrome-rett", "syndrome de Rett", "genetique", "genetique", 3, "Régression neurologique de la petite fille avec stéréotypies des mains.", {});
  P("syndrome-digeorge", "syndrome de DiGeorge", "genetique", "genetique", 3, "Microdélétion 22q11 avec malformation cardiaque, hypocalcémie et déficit immunitaire.", {});
  P("syndrome-williams", "syndrome de Williams", "genetique", "genetique", 3, "Microdélétion 7q11 avec visage d'elfe, sociabilité excessive et sténose de l'aorte.", {});
  P("syndrome-noonan", "syndrome de Noonan", "genetique", "genetique", 3, "Petite taille, cou palmé et sténose pulmonaire, de transmission dominante.", {});
  P("progeria", "progéria", "genetique", "genetique", 3, "Vieillissement accéléré de l'enfant par mutation de la lamine A.", { alt: ["syndrome de Hutchinson-Gilford"] });
  P("ataxie-telangiectasie", "ataxie-télangiectasie", "genetique", "genetique", 3, "Troubles de l'équilibre, dilatations vasculaires et déficit immunitaire, par défaut de réparation de l'ADN.", { alt: ["syndrome de Louis-Bar"] });
  P("syndrome-wiskott-aldrich", "syndrome de Wiskott-Aldrich", "immuno", "genetique", 3, "Eczéma, plaquettes basses et déficit immunitaire, liés au chromosome X.", {});
  P("deficit-immunitaire-combine-severe", "déficit immunitaire combiné sévère", "immuno", "genetique", 3, "Absence de lymphocytes fonctionnels, avec infections mortelles dès la naissance.", { alt: ["DICS", "enfants bulles"] });
  P("granulomatose-septique-chronique", "granulomatose septique chronique", "immuno", "genetique", 3, "Phagocytes incapables de tuer les germes, avec abcès à répétition.", {});
  P("syndrome-lynch", "syndrome de Lynch", "onco", "genetique", 3, "Prédisposition héréditaire au cancer colorectal sans polypose.", { alt: ["HNPCC"] });
  P("polypose-adenomateuse-familiale", "polypose adénomateuse familiale", "onco", "genetique", 3, "Centaines de polypes du côlon dégénérant obligatoirement en cancer.", {});

  /* ---------------- Urgences et divers ---------------- */
  P("syndrome-reye", "syndrome de Reye", "urgences", "toxique", 3, "Encéphalopathie et atteinte du foie chez l'enfant, liée à l'aspirine lors d'une virose.", {});
  P("syndrome-des-loges", "syndrome des loges", "urgences", "mecanique", 3, "Pression trop élevée dans une loge musculaire, qui étrangle la circulation.", { alt: ["syndrome de compartiment"] });
  P("rhabdomyolyse", "rhabdomyolyse", "urgences", "traumatique", 3, "Destruction massive du muscle, avec risque d'atteinte du rein.", {});
  P("hyperthermie-maligne", "hyperthermie maligne peranesthésique", "urgences", "genetique", 3, "Emballement du métabolisme musculaire déclenché par certains anesthésiques.", {});
  P("accident-decompression", "accident de décompression", "urgences", "mecanique", 3, "Bulles d'azote formées lors d'une remontée trop rapide en plongée.", {});
  P("syndrome-queue-de-cheval", "syndrome de la queue-de-cheval", "urgences", "mecanique", 3, "Compression des racines lombosacrées, avec anesthésie en selle et troubles sphinctériens.", {});

  /* -------------------------------------------------------------------------
     Tri : par difficulte (1 a 3), puis par specialite (ordre de SPECIALITES),
     puis par nom. */
  const ordreSpecialite = Object.keys(SPECIALITES);
  PATHOLOGIES.sort((a, b) => a.difficulte - b.difficulte ||
    ordreSpecialite.indexOf(a.specialite) - ordreSpecialite.indexOf(b.specialite) ||
    a.nom.localeCompare(b.nom, 'fr'));

  const A = window.AQ = window.AQ || {};
  A.data = A.data || {};
  Object.assign(A.data, { PATHOLOGIES, SPECIALITES, MECANISMES, DIFFICULTES });
})();
