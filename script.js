document.addEventListener('DOMContentLoaded', function () {
  
   // État du modèle
  let worlds = [];  // Exemple: ['w1', 'w2', 'w3']
  let relations = [];  // Exemple : [['w1', 'w2'], ['w2', 'w3']]
  let valuations = {}; // Exemple : {'w1': {'p': true, 'q': false}}
  let propositions = new Set(); // Exemple: {'p', 'q', 'r'}


  // État de l'interface utilisateur
  let selectedWorld = null;
  let selectedRelation = null;
  let selectedValuation = null;

  // Visualisation
  let cy = null; // Instance Cytoscape pour la visualisation du modèle
  
  // Initialise Cytoscape
   function initCytoscape() {
     cy = cytoscape({
       container: document.getElementById('visualization'),
       style: [
         {
           selector: 'node',// Style pour tous les mondes du modèle
           style: {
            'background-color': 'rgb(110, 146, 197)',
             'label': 'data(label)', 
             'text-wrap': 'wrap',
             'text-max-width': '80px', 
             'text-valign': 'center',
             'text-halign': 'center',
             'width': '100px',
             'height': '100px',
             'font-size': '12px',
             'padding': '10px'  
           }
         },
         {
          selector: 'edge',// Style pour les arêtes entre différents mondes (les relations)
          style: {
            'width': 3,                          
            'line-color': '#999',                
            'target-arrow-color': '#999',         
            'target-arrow-shape': 'triangle',     
            'curve-style': 'bezier'               

          }
        },
         {
           selector: 'edge[source = target]', // pour les boucles (relation réflexive)
           style: {
             'curve-style': 'bezier',
             'control-point-step-size': 70, 
             'loop-direction': '-45deg',     
             'loop-sweep': '90deg',         
             'target-arrow-shape': 'triangle'
           }
         }
       ],
       layout: {
         name: 'circle' // Dispose les noeuds en cercle
       }
     });
   }
   
  // Initialise event listeners
   function setupEventListeners() {
    // Gestion des mondes
     document.getElementById('add-world-btn').addEventListener('click', addWorld);
     document.getElementById('delete-world-btn').addEventListener('click', deleteWorld);
     
     // Gestion des relations
     document.getElementById('add-relation-btn').addEventListener('click', addRelation);
     document.getElementById('delete-relation-btn').addEventListener('click', deleteRelation);
     
      // Gestion des valuations
     document.getElementById('set-valuation-btn').addEventListener('click', setValuation);
     document.getElementById('delete-valuation-btn').addEventListener('click', deleteValuation);
     
      // Évaluation de formule
     document.getElementById('evaluate-btn').addEventListener('click', evaluateFormula);
     
     
   // Insère l'opérateur sélectionné dans le champ de formule à la position actuelle du curseur
    document.querySelectorAll('.op-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {  
     // Récupère l'opérateur du bouton cliqué
      const op = e.target.getAttribute('data-op');
        
     // Récupère le champ d'entrée de formule
     const formulaInput = document.getElementById('formula-input');
 
     // Sauvegarde la position actuelle du curseur
     const start = formulaInput.selectionStart;
     const end = formulaInput.selectionEnd;
 
     // Récupère la valeur actuelle de la formule
     const formula = formulaInput.value;
 
     // Insère l'opérateur à la position du curseur
     formulaInput.value = formula.substring(0, start) + op + formula.substring(end);
 
     // Remet le focus sur l'entrée et déplace le curseur après l'opérateur inséré
     formulaInput.focus();
     formulaInput.selectionStart = formulaInput.selectionEnd = start + op.length;
      });
    });
    
      // Charge des exemples de modèles
     document.getElementById('load-s5-btn').addEventListener('click', loadS5Example);
     document.getElementById('load-B-btn').addEventListener('click', loadBExample);
      // Supprime le modèle
     document.getElementById('clear-model-btn').addEventListener('click',  clearModelWithConfirm);
     

  /*
  Pour sélectionner des éléments dans les listes de mondes, relations et valuations :
  */
     document.getElementById('worlds-list').addEventListener('click', (e) => {
       if (e.target.classList.contains('list-item')) {
         selectItem('world', e.target);
       }
     });
     
     document.getElementById('relations-list').addEventListener('click', (e) => {
       if (e.target.classList.contains('list-item')) {
         selectItem('relation', e.target);
       }
     });
     
     document.getElementById('valuations-list').addEventListener('click', (e) => {
       if (e.target.classList.contains('list-item')) {
         selectItem('valuation', e.target);
       }
     });
  }

 /* Pour surligner l'élément cliqué (monde, relation ou valuation) et conserver sa valeur au cas où l'utilisateur souhaiterait le supprimer. */
  function selectItem(type, element) {
  const className = 'selected'; // Nom de classe pour indiquer l'état sélectionné
  
  // Retire la mise en évidence de tous les éléments de la liste
  const list = element.parentElement; // Récupère le conteneur parent de l'élément cliqué (la liste)
  list.querySelectorAll('.list-item').forEach(item => {
    item.classList.remove(className);
  });
  
  // Ajoute la sélection à l'élément cliqué
  element.classList.add(className);
  
  // Stocke l'élément sélectionné
  if (type === 'world') {
    selectedWorld = element.textContent;
  } else if (type === 'relation') {
    selectedRelation = element.textContent;
  } else if (type === 'valuation') {
    selectedValuation = element.textContent;
  }
}
     

// Ajoute le monde au modèle
function addWorld() {
 // Récupère l'entrée et supprime les espaces supplémentaires
 const worldInput = document.getElementById('world-input');
 const world = worldInput.value.trim();
 
  if (world && !worlds.includes(world)) { // Vérifie si le monde n'est pas vide et n'est pas déjà dans la liste
   
    // Ajoute le nouveau monde au tableau des mondes et à la liste dans l'interface
    worlds.push(world);
    addToList('worlds-list', world);
  
    // Initialise toutes les propositions connues à faux
    valuations[world] = {};
    propositions.forEach(prop => {
    valuations[world][prop] = false;
  });


   // Met à jour l'interface
     updateWorldDropdowns();
     refreshValuationsList();
     worldInput.value = '';
     visualizeModel();
   
  } else if (worlds.includes(world)) {
    alert(`Le monde '${world}' existe déjà`);// Alerte si le monde existe déjà dans la liste
  }
}
 
// Supprime un monde du modèle
function deleteWorld() {
  if (!selectedWorld) return;// Si aucun monde n'est sélectionné, quitte la fonction
  
  const index = worlds.indexOf(selectedWorld);/* Trouve l'index du monde sélectionné dans le tableau des mondes */
  if (index !== -1) {
    // Supprime le monde
    worlds.splice(index, 1);
    
   // Supprime les relations impliquant le monde sélectionné (soit comme 'from' ou 'to')
    relations = relations.filter(([from, to]) => 
      from !== selectedWorld && to !== selectedWorld
    );
    
    // Supprime les valuations associées au monde sélectionné
    if (valuations[selectedWorld]) {
      delete valuations[selectedWorld];
    }
    
    // Met à jour l'interface
    refreshList('worlds-list', worlds);
    refreshRelationsList();
    refreshValuationsList();
    updateWorldDropdowns();
    selectedWorld = null;

   // Quand tous les mondes sont supprimés, on efface le modèle
   if (worlds.length === 0) {
     clearModel();
   } else {
     visualizeModel();
   }
  }
}
  
  
// Ajoute une relation entre mondes
function addRelation() {
  // Récupère les valeurs 'De' et 'Vers'
  const fromWorld = document.getElementById('from-world').value;
  const toWorld = document.getElementById('to-world').value;
  
  if (fromWorld && toWorld) {
    const relation = [fromWorld, toWorld];
    const relationStr = `${fromWorld}R${toWorld}`;
    
    // Vérifie si la relation existe déjà, sinon l'ajoute au tableau des relations
    const exists = relations.some(([from, to]) => 
      from === fromWorld && to === toWorld
    );
    
    if (!exists) {
      relations.push(relation);
      addToList('relations-list', relationStr);
      
      // Efface les sélections
      document.getElementById('from-world').value = "";
      document.getElementById('to-world').value = "";
      visualizeModel();
    }else {
      // Alerte si la relation existe déjà dans la liste
      alert(`La relation '${relationStr}' existe déjà`);
    }
  } 
}
   
function deleteRelation() {
  if (!selectedRelation) return;
    // Récupère les valeurs 'De' et 'Vers'
  const parts = selectedRelation.split('R');
  const from = parts[0];
  const to = parts[1];
    
    // Trouve et supprime la relation
    const index = relations.findIndex(([f, t]) => f === from && t === to);
     if (index !== -1) {
        relations.splice(index, 1);
        refreshRelationsList();
        selectedRelation = null;
        visualizeModel();
     }
  
}
  
// Définit une valuation dans un monde
  function setValuation() {
   // Récupère les valeurs du monde et la proposition et si elle sera vrai ou faux
  const world = document.getElementById('val-world').value;
  const prop = document.getElementById('proposition').value.trim();
  const value = document.getElementById('value').value === 'true';
  
  if (world && prop) {
    if (!prop.match(/^[a-zA-Z]$/)) {
      alert("Une proposition doit être une seule lettre alphabétique");
      return;
    }
    
    // Ajoute à l'ensemble des propositions si nouvelle
    if (!propositions.has(prop)) {
      propositions.add(prop);
      
      // Initialise cette proposition à faux dans tous les mondes
      worlds.forEach(w => {
        if (!valuations[w]) {
          valuations[w] = {};
        }
        valuations[w][prop] = false;
      });
    }
    
    // Définit la valuation spécifique demandée par l'utilisateur
    if (!valuations[world]) {
      valuations[world] = {};
    }
    valuations[world][prop] = value;
    refreshValuationsList();
    visualizeModel();
    document.getElementById('proposition').value = '';
  }
}
  

// Supprime une valuation d'un monde
function deleteValuation() {
   if (!selectedValuation) return;
   const openParen = selectedValuation.indexOf('(');
   const comma = selectedValuation.indexOf(',');
   const closeParen = selectedValuation.indexOf(')');
    // Récupère les valeurs proposition et le monde
   const prop = selectedValuation.substring(openParen + 1, comma);
   const world = selectedValuation.substring(comma + 1, closeParen);
   
   if (valuations[world] && valuations[world][prop] !== undefined) {
     // Vérifie si la proposition est utilisée dans d'autres mondes
     let propInUse = false;
     for (const w in valuations) {
       if (w !== world && valuations[w][prop] !== undefined) {
         propInUse = true;
         break;
       }
     }
     
     // Supprime la proposition de l'ensemble global si plus utilisée
     if (!propInUse) {
       propositions.delete(prop);
     }
     
     // Supprime la valuation spécifique du monde
     delete valuations[world][prop];
     
     // Enlever l'objet valuations si le monde n'a plus de propositions
     if (Object.keys(valuations[world]).length === 0) {
       delete valuations[world];
     }
     
     // Actualise l'interface utilisateur
     refreshValuationsList();
     visualizeModel();
     selectedValuation = null;
   }
}
  
 // Ajoute un nouvel élément à une liste spécifiée (identifiée par listId)
function addToList(listId, text) {
  const list = document.getElementById(listId);
  const item = document.createElement('div');
  item.className = 'list-item';
  item.textContent = text;
  list.appendChild(item);
}

// Rafraîchit le contenu d'une liste spécifiée (identifiée par listId) avec de nouveaux éléments
function refreshList(listId, items) {
  const list = document.getElementById(listId);
  list.innerHTML = '';
  items.forEach(item => addToList(listId, item));
}

function refreshRelationsList() {
 const relationStrings = relations.map(([from, to]) => `${from}R${to}`);
  refreshList('relations-list', relationStrings);
}
   
function refreshValuationsList() {
  const valuationStrings = [];
  Object.keys(valuations).sort().forEach(world => {
    Object.keys(valuations[world]).sort().forEach(prop => {
      const value = valuations[world][prop];
      valuationStrings.push(`V(${prop},${world}) = ${value ? 'Vrai' : 'Faux'}`);
    });
  });
  refreshList('valuations-list', valuationStrings);
}
  
function updateWorldDropdowns() {
  const dropdowns = ['from-world', 'to-world', 'val-world', 'init-world'];
  dropdowns.forEach(id => {
    const dropdown = document.getElementById(id);
    const current = dropdown.value; // Stocke la valeur actuelle
    
    dropdown.innerHTML = '';
    
    // Ajoute une option vide
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '';
    dropdown.appendChild(empty);
    
    // Ajoute les options de monde
    worlds.forEach(world => {
      const option = document.createElement('option');
      option.value = world;
      option.textContent = world;
      dropdown.appendChild(option);
      
      // Restaure la valeur sélectionnée si possible
      if (world === current) {
        dropdown.value = current;
      }
    });
  });
}
   
function visualizeModel() {
  // S'il n'y a pas de mondes, sort de la fonction
 if (worlds.length === 0) {
 return;
 }
  // Efface le graphe
  cy.elements().remove();
  
  // Ajoute les noeuds (mondes)
  worlds.forEach(world => {
    // Crée label avec les valuations
    let label = world;
    if (valuations[world]) {
      label += '\n';
      Object.keys(valuations[world]).sort().forEach(prop => {
        label += `${prop}=${valuations[world][prop]  ? 'Vrai' : 'Faux' }\n`;
      });
    }
    
    cy.add({
      group: 'nodes',
      data: { id: world, label: label }
    });
  });
  
  // Ajoute les relations
  relations.forEach(([from, to]) => {
    cy.add({
      group: 'edges',
      data: { source: from, target: to }
    });
  });
  
  // Choisit la disposition en fonction de la taille du graphe
  let layout;
  if (worlds.length <= 1) {
    layout = { name: 'preset' };/* Cette disposition permet de définir manuellement la position des noeuds dans le graphe */
  } else if (worlds.length <= 5) {// Cette disposition arrange les noeuds en cercle
    layout = { name: 'circle' };
  } else {
    layout = { name: 'cose' };/* 'cose' arrange les noeuds dans une disposition équilibrée */

  }
  
  // Applique la disposition
  cy.layout(layout).run();
  
 // Ajuste la vue pour afficher tous les éléments
  cy.fit();
  }
 
  
// Fonction d'évaluation de formule
  function evaluateFormula() {
   // Récupération les entrées utilisateur
  const formula = document.getElementById('formula-input').value.trim();
  const initialWorld = document.getElementById('init-world').value;
  const resultElement = document.getElementById('result');
  
  // Validation des entrées  
  if (!formula) {
    alert("Veuillez entrer une formule");
    return;
  }
  
  if (!initialWorld) {
    alert("Veuillez sélectionner un monde initial");
    return;
  }
  
  try {
   // Étape 1: Vérifie si la formule est bien formée
    if (!isWellFormed(formula)) {
      throw new Error("La formule n'est pas bien formée");
    }
    
   
    // Étape 2: Évalue la formule dans le monde initial
    const result = evaluate(formula, initialWorld);
    
    // Étape 3: Affiche le résultat
    resultElement.textContent = `${formula} est ${result ? "VRAI" : "FAUX"} dans ${initialWorld}`;
    resultElement.className = `result ${result ? "true" : "false"}`;
    
   // Étape 4: Colore le monde initial en fonction du résultat (vert si vrai, rouge si faux)
     cy.nodes().forEach(node => {
      node.style('background-color', 'rgb(110, 146, 197)');
    });
    
    
    if (result) {
      cy.getElementById(initialWorld).style('background-color', '#5cb85c');
    } else {
      cy.getElementById(initialWorld).style('background-color', '#d9534f');
    }
    
  }
  catch (error) {
    alert(error.message);
    resultElement.textContent = "Erreur d'évaluation";
    resultElement.className = "result";
  }
}

// Vérifie si la formule est bien formée
  function isWellFormed(formula) {
 
  // Vérifie l'équilibre des parenthèses
  let parenCount = 0;
  for (let i = 0; i < formula.length; i++) {
    if (formula[i] === '(') parenCount++;
    if (formula[i] === ')') parenCount--;
    if (parenCount < 0) return false;  // Parenthèse fermante non équilibrée
  }
  if (parenCount !== 0) return false;  // Parenthèse ouvrante non équilibrée
  
 // Test par analyse syntaxique de la formule
  try {
    parseFormula(formula);
    return true;
  } catch (e) {
    return false;
  }
}

/* Analyse syntaxique de la formule et construit son arbre syntaxique abstrait (AST)
 on utilise descente récursive pour respecter les priorités des opérateurs */
function parseFormula(formula) {
  // position actuelle dans la chaîne pendant l'analyse
  let position = 0;
  
  // la fonction d'analyse principale qui traite la formule entière
  function parse() {
    return parseImplication();
  }
  
  // analyse l'implication ou l'équivalence(priorité la plus basse)
  function parseImplication() {
    // d'abord analyse le membre gauche (priorité plus élevée)
    let left = parseDisjunction();
    
    while (position < formula.length) {// Traiter tous les opérateurs d'implication ou d'équivalence
      if (formula[position] === '→') {
        position++;// avance après l'opérateur
        const right = parseDisjunction();// analyse le membre droit
        left = { type: 'implication', left, right };// construit le nœud d'implication
      } else if (formula[position] === '↔') {
        position++;// avance après l'opérateur
        const right = parseDisjunction();// analyse le membre droit
        left = { type: 'equivalence', left, right };// Construit le nœud d'équivalence
      } else {
        break;// plus d'opérateurs d'implication/équivalence trouvés
      }
    }
    
    return left;
  }
  
 // analyse disjonction (ou)
  function parseDisjunction() {
    //analyse le membre gauche (priorité plus élevée)
    let left = parseConjunction();
    // tant qu'on trouve des opérateurs de disjonction
    while (position < formula.length && formula[position] === '∨') {
      position++;// Avance après l'opérateur
      const right = parseConjunction();// Analyse le membre droit
      left = { type: 'disjunction', left, right };// construit le nœud de disjonction
    }
    
    return left;
  }
  
   // analyse la conjonction (eT)
  function parseConjunction() {
    let left = parseUnary();
    // tant qu'on trouve des opérateurs de conjonction
    while (position < formula.length && formula[position] === '∧') {
      position++;// Avance après l'opérateur
      const right = parseUnary();// Analyse le membre droit
      left = { type: 'conjunction', left, right }; // construit le nœud de conjonction
    }
    
    return left;
  }
  
  // analyse les opérateurs unaires (négation, nécessité, possibilité)
  function parseUnary() {
    if (position < formula.length) {
      if (formula[position] === '¬') {
        position++;
        const operand = parseUnary();// Construit le nœud de négation
        return { type: 'negation', operand };
      } else if (formula[position] === '□') {
        position++;
        const operand = parseUnary();
        return { type: 'necessity', operand };// Construit le nœud de nécessité
      } else if (formula[position] === '◇') {
        position++;
        const operand = parseUnary();
        return { type: 'possibility', operand };// Construit le nœud de possibilité
      }
    }
     // si ce n'est pas un opérateur unaire, c'est forcément un atome
    return parseAtom();
  }
  
   // analyse les atomes et expressions entre parenthèses
  function parseAtom() {
    if (position < formula.length) {
       // pour les propositions 
      if (/^[a-zA-Z]$/.test(formula[position])) {
        return { type: 'proposition', name: formula[position++] };
      }
      
       //on traite les expressions entre parenthèses
      if (formula[position] === '(') {
        position++; // Saute '('
        const subformula = parse();
        
        if (position < formula.length && formula[position] === ')') {
          position++; // Saute ')'
          return subformula;  // Retourne la sous-formule 
        } else {
          throw new Error("Erreur de syntaxe");
        }
      }
    }
    
    throw new Error("Error de syntaxe");
  }
  
  // Commence l'analyse 
  const ast = parse();
  
  // Vérifie que toute la formule a été consommée
  //(s'il reste des caractères, c'est qu'il y a une erreur de syntaxe)
  if (position !== formula.length) {
    throw new Error("Erreur de syntaxe");
  }
  
  return ast;
}

// Évalue la formule dans un monde donné
function evaluate(formula, world) {
  // crée un arbre de syntaxe abstraite (AST) à partir de la formule
  const ast = parseFormula(formula);
  
 
  function evaluateNode(node, currentWorld) {
    switch (node.type) {
      case 'proposition':
       // si la proposition n'est pas définie dans le monde, par défaut à faux
        if (!valuations[currentWorld] || valuations[currentWorld][node.name] === undefined) {
          return false;
        }
        return valuations[currentWorld][node.name];
        
      case 'negation':
        return !evaluateNode(node.operand, currentWorld);
        
      case 'conjunction':
        return evaluateNode(node.left, currentWorld) && evaluateNode(node.right, currentWorld);
        
      case 'disjunction':
        return evaluateNode(node.left, currentWorld) || evaluateNode(node.right, currentWorld);
        
      case 'implication':
        return !evaluateNode(node.left, currentWorld) || evaluateNode(node.right, currentWorld);
        
      case 'equivalence':
        return evaluateNode(node.left, currentWorld) === evaluateNode(node.right, currentWorld);
        
      case 'necessity':
       // pour tous les mondes liés, la formule doit être vraie
        return relations
          .filter(([from, to]) => from === currentWorld)// sélectionne toutes les relations partant du monde actuel
          .every(([_, relatedWorld]) => evaluateNode(node.operand, relatedWorld));/* vérifie si la formule est vraie dans tous ces mondes*/
        
      case 'possibility':
        // pour au moins un monde lié, la formule doit être vraie
        return relations
          .filter(([from, to]) => from === currentWorld)// sélectionne toutes les relations partant du monde actuel
          .some(([_, relatedWorld]) => evaluateNode(node.operand, relatedWorld));/* vérifie si la formule est vraie dans au moins un de ces mondes*/
          
          
      default:
        throw new Error("Error");
    }
  }

  // Évalue l'AST complet dans le monde spécifié
  return evaluateNode(ast, world);
}


 // Charge un exemple de modèle pour le système de logique modale S5
function loadS5Example() {
  if (worlds.length > 0) {// Si un modèle existe déjà, demande à l'utilisateur de confirmer le remplacement
    if (!confirm("Cela va remplacer le modèle actuel. Continuer?")) {
      return;
    }
  }
  
  clearModel();
  
  // Ajoute les mondes
  ['w1', 'w2', 'w3'].forEach(world => {
    worlds.push(world);
    addToList('worlds-list', world);
  });
  
  // Ajoute les propositions à l'ensemble
  propositions.add('p');
  propositions.add('q');
  
  // Ajoute les relations pour système S5 (réflexive, symétrique, transitive)
  const relationPairs = [
    ['w1', 'w1'], ['w2', 'w2'], ['w3', 'w3'], // Réflexive
    ['w1', 'w2'], ['w2', 'w1'], // Symétrique
    ['w2', 'w3'], ['w3', 'w2'],
    ['w1', 'w3'], ['w3', 'w1']//transitive
  ];
  
  relationPairs.forEach(([from, to]) => {
    relations.push([from, to]);
    addToList('relations-list', `${from}R${to}`);
  });
  
  // Ajoute les valuations
  valuations = {
    'w1': { 'p': true, 'q': false },
    'w2': { 'p': false, 'q': true },
    'w3': { 'p': true, 'q': true }
  };
  refreshValuationsList();
  
  // Met à jour les listes déroulantes
  updateWorldDropdowns();
  
  // Définit une formule d'exemple
  document.getElementById('formula-input').value = '□◇p';
  document.getElementById('init-world').value = 'w1';
  
  // Visualise
  visualizeModel();
}

// Charge un exemple de modèle pour le système de logique modale B
function loadBExample() {
 if (worlds.length > 0) {// Si un modèle existe déjà, demande à l'utilisateur de confirmer le remplacement
   if (!confirm("Cela va remplacer le modèle actuel. Continuer?")) {
     return;
   }
 }
 
 clearModel();
 
 // Ajoute les mondes
 ['w1', 'w2', 'w3', 'w4'].forEach(world => {
   worlds.push(world);
   addToList('worlds-list', world);
 });
 
 // Ajoute les propositions à l'ensemble
 propositions.add('p');
 propositions.add('q');
 
 // Ajoute les relations pour un modèle réflexif et symétrique (système B)
 const relationPairs = [
   // Relations réflexives
   ['w1', 'w1'], ['w2', 'w2'], ['w3', 'w3'], ['w4', 'w4'],
   
   // Relations symétriques
   ['w1', 'w2'], ['w2', 'w1'],
   ['w2', 'w3'], ['w3', 'w2'],
   ['w3', 'w4'], ['w4', 'w3']
 ];
 
 relationPairs.forEach(([from, to]) => {
   relations.push([from, to]);
   addToList('relations-list', `${from}R${to}`);
 });
 
 // Ajoute les valuations
 valuations = {
   'w1': { 'p': true, 'q': false },
   'w2': { 'p': false, 'q': true },
   'w3': { 'p': true, 'q': true },
   'w4': { 'p': false, 'q': false }
 };
 refreshValuationsList();
 
 // Met à jour les listes déroulantes
 updateWorldDropdowns();
 
 // Définit une formule d'exemple pour le système B (réflexif + symétrique)
 document.getElementById('formula-input').value = 'p→□◇p';
 document.getElementById('init-world').value = 'w1';
 
 // Visualise
 visualizeModel();
  }
  

/* Vide toutes les données du modèle (mondes, relations, valuations, propositions, etc.) 
   et met à jour l'interface pour refléter l'état initial. */

  function clearModel() {
 
     worlds = [];
     relations = [];
     valuations = {};
     propositions.clear();
     selectedWorld = null;
     selectedRelation = null;
     selectedValuation = null;
     
      // Efface les éléments de l'interface
     document.getElementById('worlds-list').innerHTML = '';
     document.getElementById('relations-list').innerHTML = '';
     document.getElementById('valuations-list').innerHTML = '';
     document.getElementById('result').textContent = 'Non évalué';
     document.getElementById('result').className = 'result';
     document.getElementById('formula-input').value = '';
     // Réinitialise les menus déroulants
     updateWorldDropdowns();
     
       // Efface la visualisation
     if (cy) {
       cy.elements().remove();
     }
  }
 
  /* Demande confirmation à l'utilisateur avant de vider le modèle  */
  function clearModelWithConfirm() {
    if (confirm("Êtes-vous sûr(e) de vouloir effacer le modèle ?")) {
      clearModel();
    }
  }

  // Appels de fonction pour initialiser Cytoscape et event listeners au démarrage de l'application
  initCytoscape();
  setupEventListeners();
  
 });