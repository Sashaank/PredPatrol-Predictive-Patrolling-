                                                          /*************** PREDPATROL --- INTERNAL FUNDED PROJECT ( FUNDED BY SSN )
                                                                           DEVELOPED BY RUSHVANTH BHASKAR, SASHAANK P.M, SANGAVI V, YAADESH KUMAR
                                                                                      GUIDED BY S. KARTHIKA           ***************************/


function onChangeFileUpload(){
  handleFiles();
  onChooseFile(event, onFileLoad.bind(this, "contents"));
}

window.onload= function(){document.getElementById("bayes-select").onclick = function() {go()};};

/************** SELECTING FILE & DISPLAYING NAME *****************/



// selectedFile.addEventListener("change", handleFiles, false);
function handleFiles(){
  var selectedFile = document.getElementById("file-upload").files;

//var fList = this.files;
var f1 = selectedFile[0].name;
console.log(selectedFile[0].name);
document.getElementById("filename").value = f1;
}

/******************************************************************/



/************* FILE READING ***************/

function onFileLoad(elementId, event) {
    document.getElementById(elementId).innerText = event.target.result;

}

function onChooseFile(event, onLoadFileHandler) {
    if (typeof window.FileReader !== 'function')
        throw ("The file API isn't supported on this browser.");
    let input = event.target;
    if (!input)
        throw ("The browser does not properly implement the event object");
/*     if (!input.files)
        throw ("This browser does not support the `files` property of the file input."); */
    if (!input.files[0])
        return undefined;
    let file = input.files[0];
    console.log(file.name);
    let fr = new FileReader();
    fr.onload = onLoadFileHandler;
    fr.readAsText(file);
}



/*******************************************************************/





/**************************************************** BAYES ALGORITHM **********************************************/



var Bayes = (function (Bayes) {
    Array.prototype.unique = function () {
        var u = {}, a = [];
        for (var i = 0, l = this.length; i < l; ++i) {
            if (u.hasOwnProperty(this[i])) {
                continue;
            }
            a.push(this[i]);
            u[this[i]] = 1;
        }
        return a;
    }
    var stemKey = function (stem, label) {
        return '_Bayes::stem:' + stem + '::label:' + label;
    };
    var docCountKey = function (label) {
        return '_Bayes::docCount:' + label;
    };
    var stemCountKey = function (stem) {
        return '_Bayes::stemCount:' + stem;
    };
    //var detReport = '';
    var log = function (text) {
        console.log(text);
		//for(var i=0;i<text.length;i++){
		//document.getElementById("r1").innerHTML += text[i] + "<br>";
		//detReport += text[i] + "<br>";
		//}

    };

    var tokenize = function (text) {
        text = text.toLowerCase().replace(/\W/g, ' ').replace(/\s+/g, ' ').trim().split(' ').unique();
        return text;
    };

    var getLabels = function () {
        var labels = localStorage.getItem('_Bayes::registeredLabels');
        if (!labels) labels = '';
        return labels.split(',').filter(function (a) {
            return a.length;
        });
    };

    var registerLabel = function (label) {
        var labels = getLabels();
        if (labels.indexOf(label) === -1) {
            labels.push(label);
            localStorage.setItem('_Bayes::registeredLabels', labels.join(','));
        }
        return true;
    };

    var stemLabelCount = function (stem, label) {
        var count = parseInt(localStorage.getItem(stemKey(stem, label)));
        if (!count) count = 0;
        return count;
    };
    var stemInverseLabelCount = function (stem, label) {
        var labels = getLabels();
        var total = 0;
        for (var i = 0, length = labels.length; i < length; i++) {
            if (labels[i] === label)
                continue;
            total += parseInt(stemLabelCount(stem, labels[i]));
        }
        return total;
    };

    var stemTotalCount = function (stem) {
        var count = parseInt(localStorage.getItem(stemCountKey(stem)));
        if (!count) count = 0;
        return count;
    };
    var docCount = function (label) {
        var count = parseInt(localStorage.getItem(docCountKey(label)));
        if (!count) count = 0;
        return count;
    };
    var docInverseCount = function (label) {
        var labels = getLabels();
        var total = 0;
        for (var i = 0, length = labels.length; i < length; i++) {
            if (labels[i] === label)
                continue;
            total += parseInt(docCount(labels[i]));
        }
        return total;
    };
    var increment = function (key) {
        var count = parseInt(localStorage.getItem(key));
        if (!count) count = 0;
        localStorage.setItem(key, parseInt(count) + 1);
        return count + 1;
    };

    var incrementStem = function (stem, label) {
        increment(stemCountKey(stem));
        increment(stemKey(stem, label));
    };

    var incrementDocCount = function (label) {
        return increment(docCountKey(label));
    };

    Bayes.train = function (text, label) {
        registerLabel(label);
        var words = tokenize(text);
        var length = words.length;
        for (var i = 0; i < length; i++)
            incrementStem(words[i], label);
        incrementDocCount(label);
    };

    Bayes.guess = function (text) {
        var words = tokenize(text);
        var length = words.length;
        var labels = getLabels();
        var totalDocCount = 0;
        var docCounts = {};
        var docInverseCounts = {};
        var scores = {};
        var labelProbability = {};

        for (var j = 0; j < labels.length; j++) {
            var label = labels[j];
            docCounts[label] = docCount(label);
            docInverseCounts[label] = docInverseCount(label);
            totalDocCount += parseInt(docCounts[label]);
        }

        for (var j = 0; j < labels.length; j++) {
            var label = labels[j];
            var logSum = 0;
            labelProbability[label] = docCounts[label] / totalDocCount;

            for (var i = 0; i < length; i++) {
                var word = words[i];
                var _stemTotalCount = stemTotalCount(word);
                if (_stemTotalCount === 0) {
                    continue;
                } else {
                    var wordProbability = stemLabelCount(word, label) / docCounts[label];
                    var wordInverseProbability = stemInverseLabelCount(word, label) / docInverseCounts[label];
                    var wordicity = wordProbability / (wordProbability + wordInverseProbability);

                    wordicity = ( (1 * 0.5) + (_stemTotalCount * wordicity) ) / ( 1 + _stemTotalCount );
                    if (wordicity === 0)
                        wordicity = 0.01;
                    else if (wordicity === 1)
                        wordicity = 0.99;
               }

                logSum += (Math.log(1 - wordicity) - Math.log(wordicity));
                log(label + "icity of " + word + ": " + wordicity);
		var tempRes = label + "icity of " + word + ": " + wordicity;
    document.getElementById("r1").style.display = "block";
		document.getElementById("r1").innerHTML += tempRes + "\n";
            }
            scores[label] = 1 / ( 1 + Math.exp(logSum) );
        }
        return scores;
    };

    Bayes.extractWinner = function (scores) {
        var bestScore = 0;
        var bestLabel = null;
        for (var label in scores) {
            if (scores[label] > bestScore) {
                bestScore = scores[label];
                bestLabel = label;
            }
        }
        return {label: bestLabel, score: bestScore};
    };

    return Bayes;
})(Bayes || {});

localStorage.clear();

var go = function go() {
    var text = document.getElementById("contents").value;
    if(text == ""){
      alert("Please upload a file for analysis");
      return;
    }
    var scores = Bayes.guess(text);
    var winner = Bayes.extractWinner(scores);
    document.getElementById("test_result").innerHTML = winner.label.toUpperCase();
    document.getElementById("bayesheading").style.display = "block";
    document.getElementById("bayeswinnerscore").innerHTML = winner.score;
	  printObject(scores);
    console.log(scores);
    var i, max, min, h, html='', data = [];
    data[0] = scores["murder"];
    data[1] = scores["kidnap"];
    data[3] = scores["non-crime"];
    data[2] = scores["theft"];
    var labels = ["murder","kidnap","theft","non-crime"];
      max = min = data[0];

      for(i=0; i<data.length; i++) {
        if (max < data[i]) max = data[i];
        if (min > data[i]) min = data[i];
      }


      for(i=0; i< data.length; i++) {
        h = Math.round( 100 * ((data[i] - min) / max));
        html += '<div class="bar" style="height:' + h + '%; left:' + (i*100) + 'px">' + labels[i] + '</div>';
      }
      document.getElementById("graph-col").style.display = "block";
      document.getElementById('chart').innerHTML = html;
      document.getElementById("bayesgraphtext").style.display = "block";

};

function printObject(o) {
console.log(o["murder"]);
  var out = '';
  for (var p in o) {
    out += p + ': ' + o[p] + "<br>";
  }
  document.getElementById("r").innerHTML = out + "\n";
}


/***************************************************************************************************************************************/


/******************************** BAYES TRAINING ***************************************************/

// Murder Training
Bayes.train("R/Is conducted a preliminary inspection of the scene. A body was visible in the middle of the kitchen.  The body was lying on its right side, head to the west and feet to the east. There were broken dishes, kitchen utensils, and multiple pieces of U.S. Mail strewn about the floor. R/Is then proceeded to the location of the body.  R/Is observed a lifeless human body, a male in middle to late 60s, on the tile kitchen floor. Visual inspection indicated the victim was wearing a navy blue three-piece suit, a white dress shirt, yellow tie, and black cap-toed shoes.  Jewelry included a wedding ring, pinkie ring, tie tack, and pocket watch. The body lay on its right side with the right arm extended at an approximate 45° angle to the body and bent at the elbow at an approximate 45° angle. Clutched in the right hand was a small-caliber pistol.  The area of the stomach and torso, R/Is observed a pool of what appeared to be blood measuring approximately 12 inches by 10 inches.  Visual inspection of the hands revealed contusions and possible broken knuckles. Contusions and abrasions were also visible on the face, left and right arms. A large sharp force wound was visible in the abdomen area.",'murder');
Bayes.train("Further visual inspection revealed the front and the back of the jacket and shirt were saturated with what appeared to be blood. R/Is observed multiple injuries to the back, chest and  right forearm. R/Is delayed further inspection of the body until the arrival of the Coroner's Inspector.R/Is observed an overturned trash container and a scrap of paper on the floor near the body. No other items were immediately visible in the vicinity. CSU will conduct a thorough examination and inventory, and report their findings.",'murder');
Bayes.train("Coroner's Inspector Luwinda Johnson arrived at the scene at approximately 7:10 a.m. and joined R/Is at the body's location. Inspector Johnson pronounced the victim deceased at 7:24 a.m. by visual observation that the victim was not breathing and by tactile observation that the victim did not have a palpable carotid pulse or any other indications of heartbeat or respiration. Inspector Johnson visually examined the body and observed what appeared to be multiple sharp force injuries to the back, chest and right forearm as well as a blunt force injury to the right side of the head. Inspector Johnson noted that rigor mortis was not yet evident and early indications of livor mortis were observable on the anterior of the body and the right side of the face. While she withheld an official estimate pending an autopsy, Inspector Johnson speculated the victim had been dead approximately 2 to 4 hours. Inspector Johnson indicated that further details would be available in the official autopsy report.",'murder');

//Kidnap Training
Bayes.train("Angela Meeker was last seen on July 7, 1979, two days before her 14th birthday.  She left her home in southern Tacoma, Washington, and was on her way to the Tacoma Mall to buy a birthday card for a friend.  Angela was reportedly seen at a party that evening, however, she did not return home and has not been seen or heard from since that evening.  Angela would now be 51 years old.Angela Meeker was last seen wearing a black floral print shirt, blue jeans, a satin jacket, sandals, and a black felt hat with red feathers on it.",'kidnap');
Bayes.train("On July 6, 2001, ten-year-old Tionda Z. Bradley and her sister, three-year-old Diamond Yvette Bradley, were reported missing to the Chicago Police Department, Chicago, Illinois. According to their mother, a note written by Tionda was found, stating that the two girls were going to the store and to the school playground. An extensive search of the area and surrounding neighborhood met with negative results.",'kidnap');

//Theft Training
Bayes.train("Gaines told me he lives alone. He was out of town on business when the burglary happened. He had left on Monday, April 5, at approximately 6:15 p.m. and returned on Friday morning at approximately 8:45 a.m. Because he used his car for the trip, there was no car in his carport when he was gone. He said because he left during daylight, he hadn’t thought to leave any lights burning. He is a sales representative for Pfizer, and many people know that he often does business from home and makes sales trips.When he returned from his trip, he saw a broken window over the kitchen table.The following items are missing from his home office:Dell Alienware computer,HP Laserjet Printer.I lifted latent fingerprints from the desk in Gaines’ home office. In the kitchen I saw fragments of glass on the floor. The broken window is about 4½ feet high by 6 feet across. I walked through the rest of the house and saw no other evidence of the break-in. All doors and all other windows are intact.I went to the back yard and saw that the broken kitchen window is about three feet from the ground. I photographed the broken window from inside the kitchen and from the back yard.",'theft');
Bayes.train("At approximately 7:15 a.m., Friday morning, Mrs. King, the seventh grade science teacher, thought something was fishy as she walked down the hall and noticed that her door was open. She walked into her classroom and immediately discovered that the small aquarium had been broken and her prized gold fish were gasping in the sink. Beside the broken aquarium were the shattered remains of the pink piggy bank that had been on the shelf above the aquarium. A can of blue paint was spilled on the floor. Footprints of a barefooted burglar led to an open window. Bits of a white powdery substance were found next to the broken, empty, piggy bank. The only other item found was a half-eaten large chunk of chocolate candy.",'theft');

// Non-murder Training
Bayes.train("One morning in late September 2011, a group of American drones took off from an airstrip the C.I.A. had built in the remote southern expanse of Saudi Arabia. The drones crossed the border into Yemen, and were soon hovering over a group of trucks clustered in a desert patch of Jawf Province, a region of the impoverished country once renowned for breeding Arabian horses.", 'non-crime');
Bayes.train("Just months ago, demonstrators here and around Egypt were chanting for the end of military rule. But on Saturday, as a court ruling about a soccer riot set off angry mobs, many in the crowd here declared they now believed that a military coup might be the best hope to restore order. Although such calls are hardly universal and there is no threat of an imminent coup, the growing murmurs that military intervention may be the only solution to the collapse of public security can be heard across the country, especially in circles opposed to the Islamists who have dominated post-Mubarak elections. ", 'non-crime');
Bayes.train(" Syrian rebels released 21 detained United Nations peacekeepers to Jordanian forces on Saturday, ending a standoff that raised new tensions in the region and new questions about the fighters just as the United States and other Western nations were grappling over whether to arm them. The rebels announced the release of the Filipino peacekeepers, and Col. Arnulfo Burgos, a spokesman for the Armed Forces of the Philippines, confirmed it.", 'non-crime');
Bayes.train(" The 83rd International Motor Show, which opened here last week, features the world premieres of 130 vehicles. These include an unprecedented number of models with seven-figure prices, including the $1.3 million LaFerrari supercar, the $1.15 million McLaren P1, the $1.6 million Koenigsegg Hundra and a trust-fund-busting Lamborghini, the $4 million Veneno. The neighborhood has become so rich that the new Rolls-Royce Wraith, expected to sell for more than $300,000, seemed, in comparison, like a car for the masses.", 'non-crime');
Bayes.train("David Hallberg, the statuesque ballet star who is a principal dancer at both the storied Bolshoi Ballet of Moscow and American Ballet Theater in New York, is theoretically the type of front-row coup that warrants a fit of camera flashes. But when Mr. Hallberg, 30, showed up at New York Fashion Week last month, for a presentation by the Belgian designer Tim Coppens, he glided into the front row nearly unnoticed, save for a quick chat with Tumblr’s fashion evangelist, Valentine Uhovski, and a warm embrace from David Farber, the executive style editor at WSJ.", 'non-crime');



/*****************************************************************************************************/
