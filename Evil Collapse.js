document.addEventListener('corru_resources_added', ()=>{
  if (page.path == "/local/beneath/embassy/" || page.path == "/local/ocean/embassy/" || page.path == "/local/ocean/embassy/golem/" || page.path == "/local/ocean/embassy/groundsmindry/"){
//Items
//Restorative
  env.STATUS_EFFECTS.item_restorative.events.onCreated = function({statusObj}) {
    if(statusObj.slug == "item_restorative" && !this.status.initialized) {
      this.status.initialized = true;
      this.status.affecting.restorativeCount = 1;
      this.status.affecting.lastStand = "restoratives";
    }
  };
//Satik Cyst
  env.STATUS_EFFECTS.item_satik.events.onCreated = function({statusObj}) {
    if(statusObj.slug == "item_satik" && !this.status.initialized) {
      this.status.initialized = true;
      this.status.affecting.satikCount = 1;
    }
  };
//Aima Cyst (item_aima)
//Kavruka Bomb
  env.STATUS_EFFECTS.item_kavruka.events.onCreated = function({statusObj}) {
    if(statusObj.slug == "item_kavruka" && !this.status.initialized) {
      this.status.initialized = true;
      this.status.affecting.kavrukaDrawn = false;
      this.status.affecting.kavrukasLeft = 1;
      this.status.affecting.kavrukaLimited = true;     
    }
  };
//Disabler
  env.STATUS_EFFECTS.item_disabler.events.onCrit = function({subject, origin, attack, beneficial}) {
    if(
                    env.rpg.turnData[`${origin.id}-disabler`] || 
                    subject == this.status.affecting || 
                    beneficial || 
                    origin.team.members.includes(subject) || 
                    subject.state == "dead" || 
                    this.status.affecting.disablerUsed
    ) return;
    addStatus({target: subject, origin, status: "weakened", length: 3, dontDrawIconLine: true});
    if(!hasStatus(subject, "weakened")) return;
    env.rpg.turnData[`${origin.id}-disabler`] = true;
                
    drawEffectLine(this.status, subject, {
                    color: "neutral",
                    effectClass: "baseline icon thick",
                    duration: 3000,
                    style: `--icon: url(${this.status.icon})`
    });
    setTimeout(()=>{                    
      env.rpg.effectMessage.action({
                        user: origin,
                        target: subject,
                        reason: this.status.name,
                        action: this.status.strings.jab,
                        specialHitText: this.status.strings.stunned,
                        isMinor: true,
                        status: this.status
      });
    }, env.ADVANCE_RATE * 0.25);
  },
//item_fusedlight
  env.STATUS_EFFECTS.item_fusedlight.help = `<n-col>on turn</n-col>, random ally gains +2T of random positive status<n-col class="shiftdetail minordetail">\n(<f-col definition="STATUS++focused">FOCUSED</f-col>, <f-col definition="STATUS++evasion">EVASION</f-col>, <f-col definition="STATUS++regen">REGEN</f-col>, <f-col definition="STATUS++carapace">CARAPACE</f-col>, <f-col definition="STATUS++spikes">SPIKES</f-col> or <f-col definition="STATUS++empowered">EMPOWERED</f-col>)</n-col>`;
  env.STATUS_EFFECTS.item_fusedlight.events.onTurn = function() {
    let target = this.status.affecting.team.members.filter(m => m.state == "living").sample();
    if(!target) return;
    let status = ["focused", "evasion", "regen", "carapace", "spikes", "empowered"].sample();
    addStatus({target, origin: this.status.affecting, status, length: 2, dontDrawIconLine: true});
    setTimeout(()=>{
                    drawEffectLine(this.status, target, {
                        color: "friend",
                        effectClass: "baseline icon",
                        duration: 3000,
                        style: `--icon: url(${this.status.icon})`
                    });
                    setTimeout(()=>{                       
                        play("laser", 2);
                        env.rpg.effectMessage.action({
                            user: this.status.affecting,
                            target,
                            reason: this.status.name,
                            action: this.status.strings.boon,
                            isMinor: true,
                            status: this.status,
        });
      }, env.ADVANCE_RATE * 0.25);
    }, env.ADVANCE_RATE * 0.25);
  };
//Parii Spike
//  env.STATUS_EFFECTS.item_pariispike.events.onCreated = function({statusObj}) {
//item_antibarrier
//item_shell
//item_antistatus
//item_surge
//item_hope
//item_translator
//Moves
//Self Destruct (Basic Golem)
  env.ACTIONS.special_self_destruct.stats = {
    accuracy: 0.75,
    amt: 1,
  };
//Beserk (Golem)
  env.ACTIONS.berserk = {
        slug: "berserk",
        name: "Berserk",
        type: 'autohit',
        help: "+2T:DESTABILIZE +1:SPIKES +2T:CARAPACE",
        anim: "heal",
        usage: {
            act: "%USER MELTS INTO A MORE AGGRESSIVE SHAPE"
        },

        details: {
            flavor: `'self-modify for maximum offense';'destabilize form and react to attacks'`,
            onUse: `[STATUS::destabilized] [STATUS::spikes] [STATUS::carapace]`
        },
        stats: {
            status: {
                destabilized: {name: 'destabilized', length: 2 },
                spikes: {name: 'spikes', length: 2 },
                carapace: {name: 'carapace', length: 2},
            }
        }, 
        exec: function(user, target) {
            play('destabilize', 0.5);
            addStatus({target: user, status: "destabilized", length: 2, noReact: true}); 
            addStatus({target: user, status: "spikes", length: 1, noReact: true}); 
            addStatus({target: user, status: "carapace", length: 2, noReact: true}); 
            return 'nothing';
        },
  };
//Spy now gives critical flaw on crit
  env.ACTIONS.spy.stats = {
    crit: 0.25,
    range: 5,
    autohit: true,
    status: {
      vulnerable: {
        name: 'vulnerable',
        length: 3
      },
      critical_flaw: {
        name: 'critical_flaw',
        length: 3
      }
    }
  };
  env.ACTIONS.spy.exec = function(user, target) {
    reactDialogue(user, `give_vulnerable`);
    return env.GENERIC_ACTIONS.singleTarget({
      action: this, 
      user, 
      target,
      hitSfx: {
        name: 'status',
        rate: 0.75
      },
      critSfx: {
        name: 'status',
        rate: 0.5
      },
      hitStatus: this.stats.status.vulnerable,
      critStatus: this.stats.status.critical_flaw,
    });
  };
//
//Enemies
//Shared enemy Dialogue
  let reactionOverride = {
    basic_incoherent: {
            catchall: [""],
            receive_hit: ["1UiÃ«2Wâ€¡", "â€¡eÃŽKÃŸJÃ¤Ã¤", "/â€¦Â¿?Ã· Ã´LÃ£Ã˜", "CÂ©Ã‹", "0Eâ„¢NÃ³Â¨Ã½QÃ’", "â‚¬LWÃ©{Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "Â£~UÃ¾fÃ¢", "â€¦TÃº**"],
            receive_crit: ["themÂ±yâ„¢ÂÂ£Vâ€ ", "Ã±a3Ã™Ã¦mÃªÃ“ÂÂ§Â°ÃœÃ·ÃŸR", "ÂÃ·Â²ave rs i onÂ¬_.g?Ã§", ")Â§=XÂ«vÅ¡rpersÂ®Â¿Ã¦ÂshÃžÂ»"],
            receive_puncture: ["tHÂ¾ cÂ©râ€¹Ãœ", "hÃœÂ±ger", "%y0#Ãºu", "â‚¬^EÂ¿ythin8"],
            receive_destabilized: ["Ã‰â€¦VE  rÃ½Ã’;-nÃ‹", "t#8â€¡  thÄ›r", "Â©NÂ£ aÂ¤d mÃ†^Â¥", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã"],
            receive_fear: ["iÃ·Â¾(ÃÃ¹ a mÂ¯Â¯]..â€ r+Ã½Ã·^Ã¦nG", "zÃzÂ¾uc/I!", "TRÃ½Â¦NG"],
            receive_stun: ["Â¦(Ã›Âc\Â½â€°still time still  ti #*Ã«Â²`t hÃ†^â‚¬", " Â¤Â±Ã’Ã¿=WA ST ING %â€°Â¶Å¡ TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s^Ã‹Â£", "Â¤Ã‚Ã¦Â©ceded contr@Â¦", "cÃ˜ntrÂ©l", "£Xp©sœ±", "t#E Æy€s"],
            receive_weakened: ["s| ump  ed agai7sâ€¡", "d^#ll", "m@llâ€¡ab/$"],
            receive_open_wound: ["Ã Ã›Æ’Å¾Â¼â„¢â€˜Â½Ã»QrÂ¬Ã†within5|Å’â€™^"],
            receive_rot: ["Ã£Å’hls t Ã’ p s  s tÃ˜p sâ€  tp  ss tÂº p", "plÂ»ËœÂ¿Å Ã©Â¦  â€¦#Ã± st#ÃžÃ¸  THâ€¹Ã®", "s/:Â£tÃ•p"],
            dead: ["Ã†Â®ki%z7", "pl@Â¨e <seÂ½", "â€¢Â¶LeÂµ)Â¬sÃŠ", "PLÃ¦EÂ§Â½"],
            evade: ["s â€ Å’Â¥Ã³`y  @wÅ“ Â¥", "n^Ã’  cl0s ÃŠr", "i w+ wi`ll nÃ’ t^l#â€¡", "lÃ†t 7ou /et^yÃ¸Ãœ"],
            puncture: ["hÂ¿â€°ngÅ“r", "e}vÂªerytÃ­h&|n8", "%ÂÃ¿oÃ›Ã™", "bLÂºÃ’dâ€¢Å“Â°", "h#ÃºÉŒâ€¡s"],
            destabilized: ["NÂ©Ã·Â·./ Ã²Â¤,_)Ã‹ Ãâ€¡)Å¡Å¡Â« DÃ‹Ã…?}", "dÃ†is co ne ct", "sâ€¡Â¦Ll hÃ©%3", "hÂ£R#"],
            stun: ["s7Ã†lli ng", "oÃœâ€¡Ã’uâ€ 0ut"],
            regen: ["pe@cÂ¨e", "@ ne", "clâ‚¬Â§e&", "f/Ã‹s#"],
            crit: ["ÃœÂ diÂ¢Ã¶1â‚¬Oe ÃŽ", "only way tÂ¥Â¨Ã¤ÃÂ£RËœÃ’w", "REâ€ ÃºRÂ¿"],
            miss: ["c0-m e wâ‚¬ÂºÃ¹|Â±|h m e", "cÃ’ mâ‚¬wi thwIt#", "uÂ§ WÂ¦t6 >S", "Â¶0Â¦N jÂ©/n"],
            crit_buff: ["aR#â‚¬r", "f@r Â¥Â©Ãœ", "prÃ’â€¡Â£cÂ±"],
            receive_buff: ["ÂµÃ¿ÃiKÂp%Ã‘", "shâ‚¬lL"],
            receive_rez: ["c@`nNâ‚¬t", "wÂ¿lLn0t"],
            receive_carapace: ["MÃ‹ÂºYÂ¾Ã‘", "prÃ˜*teÂ©Te6", "Â¦ns<de"],
            receive_repairs: ["bÃ‚rriâ‚¬r %#"],
            receive_redirection: ["â€¡ogethe ÃƒrIÃ¼Ã‘Â±Ãºâ,¿}?}", "f/Nn@<Â¥ awÃƒÂ¦e", "c0aL*sâ‚¬Â£`"],
            receive_focus: ["}Ã­speaks clearlyÃ¿B  utÂ²Ã¥Ã¿Â±Ã¡", "t% fÃ’c8s", "we see you"],
            receive_evasion: ["ÃŸRÄ›Â¿^red"],
            receive_regen: ["tÂ£@M", "r<PÃ¦Â¦rs", "t#Ã†-wâ‚¬"],
            receive_spikes: ["[Â¶Ã¿=>drastic measure)%â€°", "awÃƒÂ¥"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["IÃœ4â€¡Ã¾Ã¸Ã¯aÃ¸know what must be done"],
            give_vulnerable: ["L I S T E   NbÅ ÃžÃaÃ¼1", "L I  S T E N   "],
            give_redirection: ["R E TU RN", "S  T O P"],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
    },
    husk: {
            receive_hit: ["hu r ts", "t  he thpa in", "nO  ty  et  ", "ag  onÂ¥", "ag grâ€¡ ~â‚¬ve"],
            receive_crit: ["HU R TS", "T  HE THPA IN", "N0  TY  ET  ", "AG  ONâ€¡", "AG GRâ€¡ ~â‚¬VE"],
            receive_puncture: ["hÂ¿(â€°n g er", "e}vÂªer ytÃ­h&i ng", "%ÂÃ¿oÃ›Ã™", "n  o  non  o  n"],
            receive_destabilized: ["e ve  rÂ¥o ne", "t o  ge theÂ½", "on  e mÃ†  ny", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã", "dÃ†is co ne ct"],
            receive_fear: [" a m    â€ r Ã½  Ã¦nG", "zÃ›zÂ½  Ãºcr I", "TRÃ½  Â¦NG"],
            receive_stun: ["still time still  ti m e  t her re", "   WA ST ING     TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s e e", "   ceded contr ol", "co  ntr+ol", "e xpo  se  ", "e  yes th eeyes"],
            receive_weakened: ["s| ump  ed agai7sâ€¡", "d ull", "mal  lÄ›ab`7â‚¬"],
            receive_open_wound: ["     within    "],
            receive_rot: ["  s t o p s  s top st tp  ss to p", "plÂ»ËœÂ¿Å Ã©Â¦  â€¦#Ã± st#ÃžÃ¸  THâ€¹Ã®", "s  tÃ•p"],
            dead: ["Ã† ki  z7 ", "pl@Â¨e <seÂ½", "â€¢Â¶LeÂµ)Â¬sÃŠ", "PLÃ¦EÂ§Â½"],
            evade: ["s tÅ’Â¥Ã³ y  aw Å“ y", "n o  c l os er", "i w+ wi`ll n nÃ’ t lá»ƒÂ±", "l eet yo ul et yo"],
            puncture: ["hÂ¿(â€°n g er", "e}vÂªer ytÃ­h&i ng", "%ÂÃ¿oÃ›Ã™", "b lo o dâ€¢Å“Â°", "h Ãº +rt"],
            destabilized: ["NÂ©Ã·Â·./ Ã²Â¤,_)Ã‹ Ãâ€¡)Å¡Å¡Â« DÃ‹Ã…?}", "sti ll  her e", "h ere"],
            stun: ["o u  t ou t o ut", "ou to u t o  ut", "o   ut o  u  t o ", "sta  lli ng"],
            regen: ["m y f  le sh", "cl oÂ½ se Â®Â±â€¦ r", "mÂ¿ Ã³+r  e", " p ea  ce", " o  ne  "],
            crit: ["ÃœÂ diÂ¢Ã¶1â‚¬Oe ÃŽ", "R E TU RN", "o nl  ywa y  "],
            miss: ["co m e wÂº Â±h m á»ƒ", "co  mewi th with", "usw  ith u  s", "joi njo  in   "],
            receive_buff: ["ÂµÃ¿ÃiKÂp%Ã‘", "s hell "],
            receive_rez: [" can  not", " wil  lnot"],
            receive_carapace: ["MÃ‹ÂºYÂ¾Ã‘", "pr otect  ed", "ins  á¸®dá»ƒ "],
            receive_repairs: ["ba rri  Ä›#"],
            receive_redirection: ["f ina l ly aw  ake", "  oge ther ", "c oale  sce"],
            receive_focus: ["clear", "s e e", "t o  foc us", "we see you"],
            receive_evasion: ["prÄ› pÃ„re `d"],
            receive_regen: [" a  te Ã…m", "f ixfi xit fi x", "t hÃ¦w e"],
            receive_spikes: ["a wa y"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["mus tbe  don e "],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "á¸§á»‚á¸ºáµ½ á¸¿á¸ á¸«eÈ½Æ¤ á¹ƒá»‡ Ä¦É†È½â±£ á¹‚á»†", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
    },
    perturbed: {
      catchall: ["...", "", "", "", "", "", ""],
    },
    silent_creature: {}
  };
  for (const [key, value] of Object.entries(reactionOverride)) {
    env.COMBAT_REACTIONS[key] = value;
  }
//Evader Container
  env.COMBAT_ACTORS.container_evader.actions = ["container_evader"];
  env.COMBAT_ACTORS.container_evader.reactions = {
            receive_hit: ["Ã‚Ã¦2EeÂ½merges from the rivkËœÃ­â€™Ãœr", "Apply p@Â¨ste ovÃ†3Ãƒglass fractÂ½Ã¢â€¡", "ËœÃ¦Ãƒâ€™s c)%â€°ot with)Â§=XÅ’ blunt imp8J1)", "Â«Ã†Â½icking shoU!Â¯ bâ‚¬ avoided foâ€°"],
            receive_crit: ["avoÃ­Â«Â½Â¯Å’being struâ„¢5A]by !% at ÃÂ¨â€ž all coÅ“Ã·-", "Ã­t frÃ†%â„¢â€¡red the gla8S with eaÂ§Â«", "%/e sÅ’5ri looms oveâ„¢5@Â½ekiltem|Â±Ëœ", "â€°Â½Ã†n reâ‚¬%â€¡ng, the bright bulb |I1!"],
            receive_puncture: ["#3(k! may blEÅ’Å’ when det@5hÃ¦Ëœ", "cÂ©rRâ€° veinÂ§ wH#n d@â„¢Ã¦ged arÅ’", "# c!Ã·an cuâ€¡ 0n the pÂ«Ã†datOÃŸ", "tHÃ¦ Â§taÃŸ â‚¬a^h8t hÅ’r cÃ°#pleâ€¡e|Â¥"],
            receive_destabilized: ["%oâ€¡ nÅ’Ã¦d Ãœ#", "U8â€°rpÅ’rÂ§", "comÂ½Ëœ@â€¡th u#", "thÂ½Â«4!nger"],
            receive_fear: ["Â©*â€¡nÃœmÃŸered, the beaÂ§]%", "Ã•Â§Ã­#oia echoed across Â£~UÃ¾Å’"],
            receive_stun: ["3Â§Â¿QËœ=Å’!Ã£Ã˜", "Ã†3ÃƒÂ©ÃŸâ€¡Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "â€¡eÃŽKÃŸJÃ¤Ã¤", "1UiÃ«2Wâ€¡"],
            receive_vulnerable: ["w#En Å’Â½pÂ«sed, fA1ry Ã†yÅ’s"],
            receive_weakened: ["Â½Â«8h claws dulled, tâ€¡ÃŸâ€ "],
            receive_open_wound: ["without the g|aâ€°â€¡"],
            receive_rot: ["an $Â©0ection upÂ½Ã†"],
            dead: ["unablÅ’ Â½o$Â©0h!inue, he*sl@mpÃ†6", "wHÅ’nÂ½it rÃ¦@Â½hes Ã†3Â«itical", "|N*Â©mÃŸatible wÃ­â€¡h l!#Â½"],
            evade: ["ÃŸÃœËœ thâ‚¬ oÂ¿0^ent saw it coâ„¢Â½Â§g", "w#â€¡Â«er by luck or @Â½Â«Ã†Â½", "spÃ¦â‚¬d is %â€°â€¡â„¢to bÃ†"],
            puncture: ["Lâ€¡Ã·hâ„¢â€¡ead@Å’ness is normal when see%Â«Â½", "cyan ha5@|Â±ng been Ãƒâ€°ociated wÂ½Â«8", "Ãƒâ€°%apid)y decRÃ†3si#@", "|8Å’Â¯L!fÃ¦ flÃœid"],
            destabilized: ["w0^Å’s inÂ§Â©â€¡ibed", "@n Ã¦!d #Å’ thÃ† mind", "#n@wÂ½Ã¦dge Â©0â„¢â€¡ainer"],
            stun: ["Ã¦Â½Â§8Â« IÃ†Ã˜Â½ KÂ¾Ã•Â§=", "EvÅ’n so-evEn so-Å’ven so-Ã¦vÃ†n so", "dâ€¡%â€°riÃ†ntÃ¦Â«ed, it tries|Â±%", "Â½merges-eaÂ§Â«-â€°Â½Ã†nÃ¾-inÂ©â€¡ibed"],
            regen: ["Â±ll jÃœt Â²7zâ€° been inÂ¿Ã¦ÂucÃžÂ»d witH", "RÅ’ÃŸairF)%endÂ§ have t#e`3ch@"],
            crit: ["Â©ystic glÃ†Â§s when prÅ’ssured", "what Â§Ã†Å’ms like a small"],
            miss: ["reÃ†|â€¡ng from #*cÂ©^plÅ’te mÂ§sÂ§", "miÂ§Â©Ã¦lculations Â©@Â½-bÃ†"],
            receive_buff: ["Ã†ffic1Å’nt coopÃ†rÃ¦4ion iÂ§ the", "the bÂ©oÂ§t was en©ugh for"],
            receive_rez: ["Â©orrÃœ r#fÂ©rmÃ†tion !Â§"],
            receive_carapace: ["K!v havÃ† ÃŸeveloâ€¡ÃŸâ€ "],
            receive_repairs: ["Ã†pÃ¾licÃ‚â„¢â‚¬rÂ§ Â©an be essential when", "Â©8rru iÂ§ remarkabl9 â„¢â€¡leablÃ†"],
            receive_redirection: ["PÂ£~Ã¾erËœÂ½@s|tioning can enh@Nâ€°â‚¬", ")%Ã­Â§ $Â©gh riâ€°% manÃ†uver can eith#@"],
            receive_focus: ["W#â‚¬n ÃŸÃ·Å’pare6, a kÂ½v", "#$sesinÂ§=â€ he siâ„¢ÃœÃ†Â±ion"],
            receive_evasion: ["le8S Â¿Â©(led, reaÅ’â€°"],
            receive_regen: ["upon Â«%paâ€¡ÃŸ|ng, thÃ†&"],
            receive_spikes: ["â€°ÃœËœÂ©esful straâ€¡Å’Â½="],
            receive_surge: ["wit#Â²@ ÃŸ/rÂ§t of spâ‚¬Å’d"],
            receive_empowered: ["#Ã‚vâ‚¬Ëœ2w0 arâ„¢â€¡"]
  };
//Make attack give extra evasion on crit and more crit %
  env.ACTIONS.container_evader.stats = {
    accuracy: 0.8,
    crit: 0.2,
    amt: 2,
  };
  env.ACTIONS.container_evader.exec = function(user, target) {
    let hit = env.GENERIC_ACTIONS.singleTarget({
      action: this, 
      user, 
      target,
    });
    if(hit) addStatus({target: user, status: "evasion", length: 1, noReact: true});
    if(hit == "crit") {
      addStatus({target: user, status: "evasion", length: 1, noReact: true});
    }
    return hit;
  };
//Exploder Container
  env.COMBAT_ACTORS.container_exploder.actions = ["container_exploder"];
  env.COMBAT_ACTORS.container_exploder.reactions = env.COMBAT_ACTORS.container_evader.reactions;
//Spy Container
  env.COMBAT_ACTORS.container_spy.actions = ["spy", "daze_lastresort"];
  env.COMBAT_ACTORS.container_spy.reactions = env.COMBAT_ACTORS.container_evader.reactions;
//Sfer Container
  env.COMBAT_ACTORS.container_sfer.maxhp = [10];
  env.COMBAT_ACTORS.container_sfer.hp = [10];
  env.COMBAT_ACTORS.container_sfer.actions = ["container_sfer"];
  env.COMBAT_ACTORS.container_sfer.reactions = env.COMBAT_ACTORS.container_evader.reactions;
//VeilkLight
//Attendant
  env.COMBAT_ACTORS.personnel_attendant.maxhp = [30];
  env.COMBAT_ACTORS.personnel_attendant.hp = [30];
//Archival Golem
  env.COMBAT_ACTORS.archival_golem.reactions = env.COMBAT_REACTIONS.basic_incoherent;
//Basic Golem
  env.COMBAT_ACTORS.basic_golem.name = ["Standard Golem"];
  env.COMBAT_ACTORS.basic_golem.maxhp = [25];
  env.COMBAT_ACTORS.basic_golem.hp = [25];
  env.COMBAT_ACTORS.basic_golem.actions = ["special_self_destruct", "special_self_destruct", "berserk"];
//Kivskin
  env.COMBAT_ACTORS.kivskin.actions = ["windup_jab", "kivskin_guard", "kivskin_guard"];
  env.COMBAT_ACTORS.kivskin.windupActions = ["archival_smash"];
  env.COMBAT_ACTORS.kivskin.maxhp = [40];
  env.COMBAT_ACTORS.kivskin.hp = [40];


//Repairfriend
  env.COMBAT_ACTORS.surgeon_golem.name = ["Repairfoe"];
  env.COMBAT_ACTORS.surgeon_golem.hp = [30];
  env.COMBAT_ACTORS.surgeon_golem_frame = {... env.COMBAT_ACTORS.surgeon_golem}
  env.COMBAT_ACTORS.surgeon_golem_frame.hp = [15];
//Constructor
//Husk

//Dozkallvi
//Foundation Golem
//Painshelf
  env.COMBAT_ACTORS.bstrdshelf.reactions = {
            receive_hit: ["...", "...weak...", "...not enough...", "...frail...", "...no..."],
            receive_crit: ["...won't stop...", "...can't stop...", "...can't back down...", "...cease..."],
            receive_puncture: ["...the pain...", "...hurts...", "...laceration..."],
            receive_destabilized: ["...awake...", "...volatile...", "...feel it...", "...it is time..."],
            receive_fear: ["...get back...", "...stay back...", "...how...", "...not real..."],
            receive_stun: ["3Â§Â¿QËœ=Å’!Ã£Ã˜", "Ã†3ÃƒÂ©ÃŸâ€¡Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "â€¡eÃŽKÃŸJÃ¤Ã¤", "1UiÃ«2Wâ€¡"],
            receive_vulnerable: ["...exposed...", "...unsafe...", "...the eyes...", "...you see..."],
            receive_weakened: ["...limbs...", "...dull...", "...blunt...", "...not enough..."],
            receive_open_wound: ["...open...", "...cracked...", "...incision...", "...never enough..."],
            receive_rot: ["...formless..."],
            dead: ["ËœÃ­Å“Ã·-â€™Â§#3(k!=XÅ’"],
            evade: ["...slow...", "...futile...", "...sluggish...", "...my turn..."],
            puncture: ["...the red...", "...crimson...", "...broken...", "...gash..."],
            destabilized: ["...akizet...", "...remember...", "...come...", "...with me...", "...feel everything..."],
            stun: ["...Å“Â§#3(k...", "...Ã­Å“Ã·Å’-â€™...", "...k!=XÅ’..."],
            regen: ["...regenerate...", "...restoration..."],
            crit: ["...fall...", "...the fear...", "...embrace it...", "...apex...", "...rot...", "...bleed..."],
            miss: ["...you can't escape...", "...only delay...", "...again...", "...next time...", "...out...out..."],
            receive_buff: ["...heavy..."],
            receive_rez: ["...reanimation...", "...not done yet...", "...and yet it moves..."],
            receive_carapace: ["...immovable..."],
            receive_repairs: ["...unstoppable..."],
            receive_redirection: ["...need not...", "...behind?..."],
            receive_focus: ["...i see you..."],
            receive_evasion: ["...outranged...", "...you cannot win..."],
            receive_regen: ["...who?...", "...keep healing..."],
            receive_spikes: ["...payback..."],
            receive_surge: ["...a thousand limbs..."],
            receive_empowered: ["...strike..."],
            give_redirection: ["...fear...", "...face me...", "...you...", "...hit me...", "...charge...", "...will not back down..."],
  };
//BSTRD
  env.COMBAT_ACTORS.bstrdboss.reactions = {
            receive_hit: ["OW! just kidding ;-)", "that all? '_'", "i ALMSOT felt that :P", "tis only a scratch!", "ZZZZZZ"],
            receive_crit: ["NICE HIT!!!", "OW!!!!!!", "BAD ASS!", "COOL MOVES!", "Thas it!", "more of that! ;-)"],
            receive_puncture: ["ohhh, is going evrywere", "I want DOT... :/", "bullet holes only plz", "DA GOLEM!!!! @_@", "bleedink...", "GOT BUNCTURE"],
            receive_destabilized: ["WOaoOAw", "HEATING UP :-]", "I SEE NO DOWNSIDES HERE", "the DPS!!! !!!!"],
            receive_fear: ["WHAT? I AM FINE!", "THIS IS NOT COOL :/", "YOUR HAVING FUN, RIGHT?", "YOU'RE RUINING THE FUN!!!", "WTF O_O"],
            receive_stun: ["3Â§Â¿QËœ=Å’!Ã£Ã˜", "Ã†3ÃƒÂ©ÃŸâ€¡Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "â€¡eÃŽKÃŸJÃ¤Ã¤", "1UiÃ«2Wâ€¡"],
            receive_vulnerable: ["i have NO wekness", ":^O", "NO fear!!1!!!", "yuo dont see NOTHING!"],
            receive_weakened: ["fire soft :-(", "my DPS :-(", "uncooled my limbs :/"],
            receive_open_wound: ["no touchies!!", "just CLOSE IT", "my shell! :-(", "why can't I do dat :^/"],
            dead: ["ohhh! Im melting @_@", "WHAT DO YOU MEAN IM OUT??", "nicly done!", "you haven't seen the last of me!!!!", "aeaeu HUrts BAD!!", "ITS SO OVER :^("],
            evade: ["look at my MOVES!", "", "COOLEST evade!! !!", "Nuh uh! }:)", "8)", "IT S0 EASY", "can't touch dis!"],
            puncture: ["OOUUEU", "WATERHOSE!", "this hurts actually %-(", "MY GLEM!!!!!!!", "HEAL plz"],
            destabilized: ["EXILERATING }:)", "THIS FEELS WEEEIRD '_'", "DA RISKK! DA REARD!!", "DOUBLE BULLETS !!"],
            stun: ["im missing OUT!", "HANG ON! GOTTA RELOAD <:(", "JAMMED?? @_@", "TIME OUT! TIME OUT! Just kidding!", "CANT AIM WTF help"],
            regen: ["HEALZZ!! >:)", "PACHING UP ::}}", "coolest hals!1!!", "revars bleed !! !!!", "very nice {;-}", ":)", "SO BACK"],
            crit: ["boom! HEADSHOT!", "Get owned!", "look at these TRIKSHOTS", "now watch me do it 'gain }:-}", "LETS GOO!!1!!!", "WOOOO!1!!!", "BL4MN!!", "PoW!!", ">%^)"],
            miss: ["COME ON!! !!! !", "AWWW  MAN", "cool doge!", "how?? @_@", "SHT", "almost GOT U"],
            receive_buff: ["YOUR IN TROUBLE KOPER };-)", "TIME 2 GET EM ;}",
                          () => env.rpg?.lastAction?.user?.slug ? `${env.rpg?.lastAction?.user?.name?.toUpperCase()} MY GOAT!!!` : "MY GOAT!!!"],
            receive_rez: ["back to BUSYNESS!", "too EVIL to die!", "what did i miss ;-)", "DAT ALL YOU GOT?>??", "AHAHA :^) GOT U", "AHAHA :^) WE BACK", "YOUR THE GOAT!!"],
            receive_carapace: ["LIKE A NIGHT", "cant stop me now }:-)"],
            receive_repairs: ["SUSTAIN :O", "YUSSS!", "GOOD ASS", "I AM BULLETPROOF!1!!1"],
            receive_redirection: ["MOBILE COVRR!!", "INVISIBILITY!!!", "dont BLOCK MY LOS!", "will this lowar my dps??"],
            receive_focus: ["I see! I see!", "behold my genius!", "tacticul!"],
            receive_evasion: ["i am SPEED"],
            receive_regen: ["Medic!", "cool friends!", "YUMMY!"],
            receive_spikes: ["cant hit me now lol", "who wants a hug?!?!"],
            receive_surge: ["youre in troubel now! }:)", "HIT THE GAS  GAS", "doubel da fun! ;&)"],
            receive_empowered: ["bettar light11!1", "hiest calliber ;}", "more bullet per bullet!", "bettar gun11!1"],
            give_vulnerable: ["LET ME ILLUMINATE :-)", "I SEE YUO :-O", "FREE CRITS!! !  !!", "THERE!! HIT 'EM THERE!1!!"],
            give_redirection: ["hello??? i'm the bad guy here!", "no strats for you! }:^}", "ME! ME! ME! ME!", "coming through!", "all the cool to me!!!!!!"]
  };
  env.COMBAT_ACTORS.bstrdboss_lowintensity.reactions = env.COMBAT_ACTORS.bstrdboss.reactions;
  env.COMBAT_ACTORS.bstrd.reactions = env.COMBAT_ACTORS.bstrdboss.reactions;
//BSTRD Light
  env.COMBAT_ACTORS.bstrdlight.reactions = {
            receive_hit: ["OW! just kidding ;-)", "that all? '_'", "i ALMSOT felt that :P", "just fanning de flames!", "ZZZZZZ"],
            receive_crit: ["NICE HIT!!!", "OW!!!!!!", "BAD ASS!", "COOL MOVES!", "Thas it!", "more of that! ;-)"],
            receive_puncture: ["MY FUEL!!!", "I want DOT... :/", "bullet holes only plz", "DA LAMP!!!! @_@", "bleedink...", "GOT BUNCTURE"],
            receive_destabilized: ["WOaoOAw", "HEATING UP :-]", "I SEE NO DOWNSIDES HERE", "the DPS!!! !!!!"],
            receive_fear: ["WHAT? I AM FINE!", "THIS IS NOT COOL :/", "YOUR HAVING FUN, RIGHT?", "YOU'RE RUINING THE FUN!!!", "WTF O_O"],
            receive_stun: ["3Â§Â¿QËœ=Å’!Ã£Ã˜", "Ã†3ÃƒÂ©ÃŸâ€¡Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "â€¡eÃŽKÃŸJÃ¤Ã¤", "1UiÃ«2Wâ€¡"],
            receive_vulnerable: ["i have NO wekness", ":^O", "NO fear!!1!!!", "yuo dont see NOTHING!"],
            receive_weakened: ["cant fan me out?!?!", "fire soft :-(", "my DPS :-(", "cooled down?!? !?", "uncooled my limbs :/"],
            receive_open_wound: ["no touchies!!", "just CLOSE IT", "my shell! :-(", "why can't I do dat :^/"],
            dead: ["ohhh! Im melting @_@", "WHAT DO YOU MEAN IM OUT??", "nicly done!", "you haven't seen the last of me!!!!", "aeaeu HUrts BAD!!", "ITS SO OVER :^("],
            evade: ["look at my MOVES!", "Outshined! :;)}", "COOLEST evade!! !!", "Nuh uh! }:)", "8)", "IT S0 EASY", "can't touch dis!"],
            puncture: ["OOUUEU", "WATERHOSE!", "this hurts actually ;-(", "MY LAMP!!!!!!!", "HEAL plz"],
            destabilized: ["EXILERATING }:)", "!BURNING BRIGHT!", "FEEL THE HEAT!!!!!", "!!IM ON FIRE!!", "MOAR!!!!!!!!!!!!!!!!!!!", "DOUBLE FIRES !!"],
            stun: ["IM missing OUT!", "BLACKED OUT }:(", "so dark ;(", "TIME OUT! TIME OUT! Just kidding!", "CANT LIGHT WTF help"],
            regen: ["HEALZZ!! >:)", "SHINING BRITE >:)", "PACHING UP ::}}", "fueled UP!!", "kindling!1!!", "very nice {;-}", ":)", "SO BACK"],
            crit: ["burning up? :)", "Get owned!", "fired UP !_!", "SCORCHED! UP!", "LETS GOO!!1!!!", "WOOOO!1!!!", ">%^)"],
            miss: ["COME ON!! !!! !", "AWWW  MAN", "cool doge!", "you vampyr or somthing?", "SHT", "almost GOT U"],
            receive_buff: ["YOUR IN TROUBLE KOPER };-)", "NOW WERE COOKING!1", "TIME 2 GET EM ;}",
                          () => env.rpg?.lastAction?.user?.slug ? `${env.rpg?.lastAction?.user?.name?.toUpperCase()} MY GOAT!!!` : "MY GOAT!!!"],
            receive_rez: ["can't snuff me out ;-}}", "too EVIL to die!", "what did i miss ;-)", "lightened back UP!!", "AHAHA :^) GOT U", "AHAHA :^) WE BACK", "YOUR THE GOAT!!"],
            receive_carapace: ["LIKE A NIGHT", "cant stop me now }:-)"],
            receive_repairs: ["SUSTAIN :O", "YUSSS!", "GOOD ASS", "I will NOT dim % }"],
            receive_redirection: ["MOBILE COVRR!!", "INVISIBILITY!!!", "DONT BLOCK THE LITE '_'", "A BRIGHT IDEA };-)"],
            receive_focus: ["I see! I see!", "behold my genius!", "tacticul!"],
            receive_evasion: ["i am SPEED"],
            receive_regen: ["Medic!", "cool friends!", "YUMMY!"],
            receive_spikes: ["cant hit me now lol", "who wants a hug?!?!"],
            receive_surge: ["youre in troubel now! }:)", "HIT THE GAS  GAS", "doubel da fun! ;&)"],
            receive_empowered: ["bettar light11!1", "PUMPING THAT VOLTAGE", "bettar lamp11!1"],
            give_vulnerable: ["LET ME ILLUMINATE :-)", "I SEE YUO :-O", "FREE CRITS!! !  !!", "THERE!! HIT 'EM THERE!1!!"],
            give_redirection: ["hello??? i'm the bad guy here!", "no strats for you! }:^}", "ME! ME! ME! ME!", "i'm the brightest!", "all the cool to me!!!!!!"]
    };
//
//Allies
//Akizet (no contractions or capitalisations for any obesk stuff)
  env.COMBAT_ACTORS.akizet.reactions = {
            eviscerate: ["This is a test to see if this works, if you see this contact costumer support"],
            frenzy: ["die—", "die!", "DIE-", "DIE!!", "ªœp—", "ªr%—", "ç2ªÔ!!", "¤¼C—", "{þÿU—", "&A^#3!!", "ßÃÆ#!!", "@#Æ$J!!", "$¤Vª1‡!", "Fr#@!!!", "ÎK^ßT!!", "i will not stop!", "again!", "bleed!", "i will tear you apart!", "no more of you!", "it is over!"],//Unique to Akizet
            receive_hit: ["@#Æ$J", "Ff#$"],//these seem to only play when attacked by pain shelf lol
            receive_crit: ["ßÃÆM!!", "AH!"],
            receive_puncture: ["Ff#$", "i have felt worse", "a familiar feeling", "you will regret that", "i will not fall", "funfriend!", "i am used to it"],
            receive_destabilized: ["every cell... awake...", "velzie's glee", "it is kill or be killed", "i can work with this", "a high risk maneuver"],
            receive_fear: ["no, no...", "velzie forgive me", "velzie please", "it cannot be!", "STOP STOP STOP", "i know I KNOW I KNOW", "NO MORE NO MORE",
                          ()=>env.combat.has('husk') ? "the eyes..." : "so many gone...",
                          ()=>env.rpg.is2D ? "you promised! you said..." : "youîŸ~F£ßpÛ¿)"],
            receive_stun: ["Ahg!", "ÇæÙ‡ß†!", "st-!"],
            receive_vulnerable: ["exposed...", "velzie's light...", "i will endure", "...being watched", "i see you too..."],
            receive_weakened: ["my claws!", "i cannot fight like this", "i will still get you", "blunt force will do"],
            receive_open_wound: ["the glass!", "this is bad", "i need to seal this", "i need support", "stay away!"],
            receive_rot: ["i am falling apart!", "this color!", "help...", "get this off me!", "get it off! GET IT OFF!"],
            dead: ["Funf-!", "keep going", "do not give up", "you can sti-",
                    ()=>env.combat.has('tozik') ? "toz-!" : "sat-",
                    ()=>env.combat.has('cavik') ? "cav-!" : "res-"],
            evade: ["far too close", "oaa!", "nearly...", "too slow", "saw you coming", "predictable"],
            puncture: ["i need to fix this", "losing corru", "i will not back down",
                    ()=>env.combat.has('tozik') ? "tozik!" : "i need help!",
                    ()=>env.combat.has('cavik') ? "cavik!" : "restoratives?!"],
            destabilized: ["my form...", "feels... wrong...", "on the edge...", "velzie is waiting..."],
            stun: ["my arms...", "my core...", "cover me", "just give me a blink", "..."],
            regen: ["this will do", "better...", "feeling better", "good", "reforming", "lifesaving medicine", "staying in the fight"],
            crit: ["back off!", "stay down!", "stand down!",
                  ()=>env.combat.has('husk') || env.rpg.is2D ? "get away!" : "excellent!",
                  ()=>env.combat.has('husk') || env.rpg.is2D ? "stay back!" : "knockout!"],
            miss: ["œ¦êA", "i was wrong!", "rushed", "no!", "i got careless"],
            crit_buff: [()=>env.combat.has('husk') || env.rpg.is2D ? "good" : "easy!", "strike them down"],
            receive_buff: ["we are unstoppable", "alright!", "helpful, thanks",
                          () => env.rpg?.lastAction?.user?.slug ? `thank you, ${env.rpg?.lastAction?.user?.name?.toLowerCase()}` : "thank you"],
            receive_rez: ["that was close...", "it is not over", "we are not done", "...thanks", "it pays to be prepared"],
            receive_carapace: ["this armor...!", "very good", "now to strike", "the best defense..."],
            receive_repairs: ["thank you", "better!", "strike without fear", "now to strike"],
            receive_redirection: ["together!", "we will destroy them", "do not overexert", "thank you, my friend",
                                  () => env.rpg?.lastAction?.user?.slug ? `be careful, ${env.rpg?.lastAction?.user?.name?.toLowerCase()}` : "be careful, friend"],
            receive_focus: ["the way is clear", "i see the path", "follow my lead", "i have been here before", "i know what i must do"],
            receive_evasion: ["i am ready", "you will not succeed", "not this time", "my reflexes are sharp"],
            receive_regen: ["thank you", "hope this lasts", "death will not come for us", "you are a lifesaver"],
            receive_spikes: ["i am untouchable", "come on!"],
            receive_surge: ["you are done", "leave this to me"],
            receive_empowered: ["this strength!", "time to strike!", "they will not last", "even sharper still"],
            give_vulnerable: ["you are predictable", "strike them down!", "hit them there!", "you are all the same", "i see you..."],
            give_redirection: ["let me handle this", "stay behind me"],
            give_fear: ["i will tear you apart!"]
  };
//The Gakk
  env.COMBAT_ACTORS.gakvu.reactions = {
            receive_hit: ["@#Æ$J", "Ff#$"],
            receive_crit: ["ßÃÆM!!", "Æ!!"],
            receive_puncture: ["Ff#$", "i am... bleeding...?", "ow!! what...", "my cloak!", "it cut me!", "it is fine, i did not need that", "oh, great"],
            receive_destabilized: ["may velzie look away", "is my body supposed to do that?", "just need to not get hit", "all or nothing", "velzie is cackling"],
            receive_fear: ["stop looking at me!!", "get away from me!", "no, no no no", "what did it say??", "it is fine! this is fine! i am fine!", "i am not going back!", "you cannot!"],
            receive_stun: ["Ahg!", "ÇæÙ‡ß†!", "st-!"],
            receive_vulnerable: ["stop that!", "w-why me?", "uh oh", "do not dare!", "c-can we do something about this?"],
            receive_weakened: ["i cannot feel my claws", "i cannot feel them", "my mindcore!"],
            receive_open_wound: ["that should not be there", "a little help please?", "Ah! get back! get back!", "help me out!"],
            receive_rot: ["this cannot be good for my health", "my life expectancy is rapidly decreasing", "what IS this?", "blood should not be this color"],
            dead: ["hel-!", "but...", "i cann-", "velzie's joke i am sure", "i-is this it?"],
            evade: ["try again", "velzie smiles", "aaaalmost", "not quite", "is that all?", "give up",
                  ()=>env.combat.has('husk') || env.rpg.is2D ? "ah!" : "haha!",
                  ()=>env.combat.has('husk') || env.rpg.is2D ? "no!!" : "woaah!!"],
            puncture: ["such a strange feeling", "make this stop", "i cannot stop it", "i need that corru, actually",
                    ()=>env.combat.has('tozik') ? "tozik, some help?" : "some shielding please?",
                    ()=>env.combat.has('cavik') ? "cavik, some help?" : "some repairs please?"],
            destabilized: ["is this what oltazni zzoust is like?", "velzie giggles", "i see blurry", "i feel everything", "so that is what that feels like"],
            stun: ["where did my eyes go?!", "just give me a blink", "can we time out?", "like getting stomped by a veilk", "..."],
            regen: ["feeling better", "feeling good", "more of that please", "keep it rolling", "beats larval medicine for sure"],
            crit: ["clean...", "it is simply that easy", "a few more like that...", "that was lucky", "thank me later", "but of course!", "all skill", "doubted me?", "fall apart"],
            miss: ["€Öä!", "oh...", "it is too fast!!", "too bad", "just stay still!", "i cannot grasp it!", "it is not so simple"],
            crit_buff: ["so that goes there...", "thank me later", "you know what to do"],
            receive_buff: ["thanks", "thank you", "alright!"],
            receive_rez: ["you are gonna have to try a little harder", "let us make velzie rage", "my savior", "miss me?", "what did i miss?", "we should avoid that next time"],
            receive_carapace: ["so heavy", "you cannot hurt me now!"],
            receive_repairs: ["healing applicators?", "thanks", "i owe you", "you are the best"],
            receive_redirection: ["finally some space", "just keep them away", "they will not stand a chance", "are you sure?",
                                () => env.rpg?.lastAction?.user?.slug ? `${env.rpg?.lastAction?.user?.name?.toLowerCase()}??` : "really??"],
            receive_focus: ["iii see youuu", "i have my core upon you", "waiit for it...", "just you wait..."],
            receive_evasion: ["speed of a bulb", "just try and catch me", "i can dodge anything"],
            receive_regen: ["just what i needed", "very nice", "now i can get hit again",
                            () => env.rpg?.lastAction?.user?.slug ? `many thanks, ${env.rpg?.lastAction?.user?.name?.toLowerCase()}` : "many thanks"],
            receive_spikes: ["cannot touch this", "HEY! OVER HERE!", "velzie must be a fan"],
            receive_surge: ["double the gakvu", "hell yeah", "groundsmindry primed and ready", "zzoust!"],
            receive_empowered: ["heh", "my turn now", "charged up", "groundsmindry plus"],
            give_vulnerable: ["feeling weak?", "i will not let you go", "you are in my grasp now", "feeling watched?", "avoid THIS"],
            give_redirection: ["what would you do without me?"],
            give_fear: ["i will melt you!", "your corru is my plaything"]
  };
//Tozik
  env.COMBAT_ACTORS.tozik.reactions = {
            receive_hit: ["Ah!"],
            receive_crit: ["Æ!!"],
            receive_puncture: ["Ff#$!", "ÎK^ßJ!", "i can... just seal it...", "I am going to need a blink", "aÃgh!", "cover me", ""],
            receive_destabilized: ["i hear it calling", "this is against safety protocols", "...what?", "...who?", "uUugh", ""],
            receive_fear: ["that cannot be", "s-stop...", "and yet it moves", "stop...", "",
                  ()=> env.rpg.is2D ? "there is nothing here" : "hollowed out...",
                  ()=> env.rpg.is2D ? "where are you?" : "what happened to you?"],
            receive_stun: ["ÇæÙ‡ß†!", "Ahg!", "st-!", ""],
            receive_vulnerable: ["i am their target", "it sees me", "they are coming for me", "it is upon me", "it watches me", "i am exposed", ""],
            receive_weakened: ["i feel... nauseous", "the corruskivi!", "my tools are compromised", "they damaged my tools", ""],
            receive_open_wound: ["this hurts... bad...", "this will take longer to fix", "my glass is... fractured...", ""],
            receive_rot: ["this is infectious!", "it is eating at me!", "this will take longer to fix", "it burns!", ""],
            dead: ["no n-", "they-", "i ne-", "sto-", "sorry", ""],
            evade: ["close...", "woah", "not this time", "too close", "fortunate", "no", ""],
            puncture: ["i need to fix this", "hurts...", "losing form", "i just need to self repair", ""],
            destabilized: ["my form is unstable", "feels... fuzzy?", "head spinning...", "i need to not get hit", ""],
            stun: ["where...", "i cannot move...", "where are you?", "where are they?", "..."],
            regen: ["regenerating", "reparing", "reforming", "feeling better", "passive healing", "very good", ""],
            crit: ["here you go", "offensive repairs", "fuel at capacity", "",
                  ()=>env.combat.has('husk') || env.rpg.is2D ? "good enough" : "hehe"],
            miss: ["miscalculated", "no...", "damn...", "sorry", "my mistake", ""],
            crit_buff: ["keep going", "use this", "you will need this"],
            receive_buff: ["i will put it to use", "appreciated", ""],
            receive_rez: ["let us finish this", "it is not my time", "i cannot die while they need me", "back to work", "i have work to do"],
            receive_carapace: ["thank you", "a strong applicator", ""],
            receive_repairs: ["that is better", "thank you", "a buffer", ""],
            receive_redirection: ["i will return the favor", "together, then", "",
                              () => env.rpg?.lastAction?.user?.slug ? `i will cover you, ${env.rpg?.lastAction?.user?.name?.toLowerCase()}` : "i will cover you"],
            receive_focus: ["i am prepared", "i see their weak points", "hold on", ""],
            receive_evasion: ["in position", "i see them", "they will not hit me", ""],
            receive_regen: ["starting repairs", "starting regeneration", "do not worry about me", ""],
            receive_spikes: ["this formation...", ""],
            receive_surge: ["for me?", ""],
            receive_empowered: ["corruskivi reformated", ""],
            give_vulnerable: ["you are weak", ""],
            give_redirection: ["i will handle this", ""],
            give_fear: ["i will bleed you out", ""]
  };
  env.COMBAT_ACTORS.tozik_npc.reactions = {
            receive_hit: ["Ah!"],
            receive_crit: ["Æ!!"],
            receive_puncture: ["Ff#$", "ÎK^ßJ!", "i can... just seal it...", "I am going to need a blink", "aÃgh!", "cover me", ""],
            receive_destabilized: ["i hear it calling", "this is against safety protocols", "...what?", "...who?", "uUugh", ""],
            receive_fear: ["that cannot be", "s-stop...", "and yet it moves", "stop...", "",
                  ()=> env.rpg.is2D ? "there is nothing here" : "hollowed out...",
                  ()=> env.rpg.is2D ? "where are you?" : "what happened to you?"],
            receive_stun: ["ÇæÙ‡ß†!", "Ahg!", "st-!", ""],
            receive_vulnerable: ["i am their target", "it sees me", "they are coming for me", "it is upon me", "it watches me", "i am exposed", ""],
            receive_weakened: ["i feel... nauseous", "the corruskivi!", "my tools are compromised", "they damaged my tools", ""],
            receive_open_wound: ["this hurts... bad...", "this will take longer to fix", "my glass is... fractured...", ""],
            receive_rot: ["this is infectious!", "it is eating at me!", "this will take longer to fix", "it burns!", ""],
            dead: ["no n-", "they-", "i ne-", "sto-", "sorry", ""],
            evade: ["close...", "woah", "not this time", "too close", "fortunate", "no", ""],
            puncture: ["i need to fix this", "hurts...", "losing form", "i just need to self repair", ""],
            destabilized: ["my form is unstable", "feels... fuzzy?", "head spinning...", "i need to not get hit", ""],
            stun: ["where...", "i cannot move...", "where are you?", "where are they?", "..."],
            regen: ["regenerating", "reparing", "reforming", "feeling better", "passive healing", "very good", ""],
            crit: ["here you go", "offensive repairs", "fuel at capacity", "",
                  ()=>env.combat.has('husk') || env.rpg.is2D ? "good enough" : "hehe"],
            miss: ["miscalculated", "no...", "damn...", "sorry", "my mistake", ""],
            crit_buff: ["keep going", "use this", "you will need this"],
            receive_buff: ["i will put it to use", "appreciated", ""],
            receive_rez: ["let us finish this", "it is not my time", "i cannot die while they need me", "back to work", "i have work to do"],
            receive_carapace: ["thank you", "a strong applicator", ""],
            receive_repairs: ["that is better", "thank you", "a buffer", ""],
            receive_redirection: ["i will return the favor", "together, then", "",
                              () => env.rpg?.lastAction?.user?.slug ? `i will cover you, ${env.rpg?.lastAction?.user?.name?.toLowerCase()}` : "i will cover you"],
            receive_focus: ["i am prepared", "i see their weak points", "hold on", ""],
            receive_evasion: ["in position", "i see them", "they will not hit me", ""],
            receive_regen: ["starting repairs", "starting regeneration", "do not worry about me", ""],
            receive_spikes: ["this formation...", ""],
            receive_surge: ["for me?", ""],
            receive_empowered: ["corruskivi reformated", ""],
            give_vulnerable: ["you are weak", ""],
            give_redirection: ["i will handle this", ""],
            give_fear: ["i will bleed you out", ""]
  };
//Miltza
  env.COMBAT_ACTORS.miltza.initialStatusEffects = [["terror", 1]];
  env.COMBAT_ACTORS.miltza.reactions = {
            miltza_attack: ["This is a test to see if this works"],
            receive_hit: ["Ah!"],
            receive_crit: ["Æöö!!"],
            receive_puncture: ["Ff#$", "restorative, quick!", "bleeding!", "help me!", "help me out!"],
            receive_destabilized: ["die DIE!! DIE!! DIE!!!", "i feel sick", "my systems are compromised!", "you will SUFFER!!", "aAAAaah!"],
            receive_fear: ["stop...", "velzie take me from here", "stay away! away!!", "no no no!!",
                      ()=> env.rpg.is2D ? "this is not us! it is NOT!" : "it is not that! it is NOT!",
                      ()=> env.rpg.is2D ? "this cannot be real" : "that one looks like...!"],
            receive_stun: ["Ahg!", "ÇæÙ‡ß†!", "st-!"],
            receive_vulnerable: ["oh nonono", "they can do that?", "they are coming for me!", "i am in their sights!", "stop looking at me!"],
            receive_weakened: ["i can barely stand...", "my arms!", "so heavy...", "i feel sick"],
            receive_open_wound: ["they fractured the glass!", "they got me bad!", "i am badly wounded!", "they left me exposed!"],
            receive_rot: ["this-what is going on!?", "what kind of affliction is this?", "this is not natural!", "what did you do??"],
            dead: ["he-!", "n-!", "ve-!"],
            evade: ["woah!", "woOOoh", "way too close!", "i saw you!", "do not touch me!",
                ()=>env.combat.has('husk') || env.rpg.is2D ? "wah!!" : "i did it!"],
            puncture: ["i am losing cohesion!", "i need this to stop!", "still bleeding!", "i need this sealed!", "make it stop! MAKE IT STOP!"],
            destabilized: ["i cannot keep myself together!", "this is too dangerous!", "this is too risky!", "i do not like this!"],
            stun: ["oaauuuau", "i cannot think like this!", "my core!", "velzie...", "..."],
            regen: ["feeling better!", "alright!", "thank the jut", "PLEASE keep this going", "we need to keep this flowing"],
            crit: ["die!! die!!", "as planned", "as expected", "success!"],
            miss: ["useless!", "i missed??", "NO!",
                ()=>env.combat.has('husk') || env.rpg.is2D ? "how does it move like that?!" : "next time"],
            crit_buff: ["is that better?", "keep going!", "use this!", "you will need this"],
            receive_buff: ["thank you!", "i will make use of this"],
            receive_rez: ["woah, that was... weird", "let us not do that again", "i thought i was done for", "velzie smiles"],
            receive_carapace: ["a shell!", "feeling much safer!", "alright!"],
            receive_repairs: ["thank you, thank you!", "so much better"],
            receive_redirection: ["what??", "oh, thank you!", "i will be right behind you",
                                () => env.rpg?.lastAction?.user?.slug ? `be careful ${env.rpg?.lastAction?.user?.name?.toLowerCase()}!` : "be careful!"],
            receive_focus: ["they will not expect this", "i see their weaknesses", "i see them!", "they will not escape", "i am prepared"],
            receive_evasion: ["i am faster than you think", "everything is in order", "try and catch me now", "ready to react"],
            receive_regen: ["just what i needed", "PLEASE keep applying this",
                           () => env.rpg?.lastAction?.user?.slug ? `ah, thank you ${env.rpg?.lastAction?.user?.name?.toLowerCase()}!` : "ah, thank you!"],
            receive_spikes: ["this is weird...", "hopefully it will not be necesary"],
            receive_surge: ["it is like i have six arms!", "ready to act!"],
            receive_empowered: ["this strength!", "my turn now!"],
            give_vulnerable: ["i see it!", "you should aim for that", "you can hit it there and there", "keeping an eye on them", "scanning them...", "i got you!", "i have you!"],
            give_redirection: ["i am not sure about this!", "please work"],
            give_fear: ["velzie will not be kind to you"]
  };
//Bozko
  env.COMBAT_ACTORS.bozko.reactions = {
            receive_hit: ["@#Æ$J", "Ff#$"],
            receive_crit: ["Æ!!", "you!"],
            receive_puncture: ["Ff#$", "how?", "it pierced my glass", "no...", "i am bleeding?",
                  ()=>env.combat.has('cavik') ? "cavik!" : "it punched through...",
                  ()=>env.combat.has('tozik') ? "tozik!" : "stop the bleeding"],
            receive_destabilized: ["i hear them again...", "this will work in my favor", "what...?", "...to crush them", "i am not deterred"],
            receive_fear: ["no...", "stay back!", "you do not scare me!", "STAY BACK!",
                      ()=> env.rpg.is2D ? "so many lost" : "is it really you...?"],
            receive_stun: ["Ahg!", "ÇæÙ‡ß†!", "st-!"],
            receive_vulnerable: ["try me", "i will not give way", "do it", "i can take it"],
            receive_weakened: ["i can still defend", "this will not stop me"],
            receive_open_wound: ["how...?", "i will not give in", "my body...", "i cannot back down"],
            receive_rot: ["what is this?", "something is eating at me"],
            dead: ["ug-", "no...", "i failed...", "i canno-"],
            evade: ["no", "not so easy", "i am not slow", "my turn", "your last mistake"],
            puncture: ["blood everywhere", "i need patching", "need support!", "not this again..."],
            destabilized: ["unstable...", "stop this...", "i cannot defend like this"],
            stun: ["what--", "just you wait", "what is happening", "..."],
            regen: ["keep it coming", "very good", "going to need more", "feeling better"],
            crit: ["get away from them", "smashed to pieces", "die", "you are dead"],
            miss: ["ßÐƒ", "my fault", "you!"],
            crit_buff: ["take this", "you need this", "here"],
            receive_buff: ["keep it up", "good"],
            receive_rez: ["i have to get back up", "you cannot strike me down", "i cannot stay down", "they still need me"],
            receive_carapace: ["i am strong", "even tougher now", "better than chitin", "you cannot hurt me", "never show fear"],
            receive_repairs: ["this is useful, thanks", "i will make use of these", "keep adding layers"],
            receive_redirection: ["i will not stay behind", "we will do this together"],
            receive_focus: ["i am ready", "i am prepared", "i will not miss"],
            receive_evasion: ["they will not touch me", "i will not falter"],
            receive_regen: ["i need to learn to do that", "alright", "a breather",
                          () => env.rpg?.lastAction?.user?.slug ? `thank you, ${env.rpg?.lastAction?.user?.name?.toLowerCase()}` : "thank you"],
            receive_spikes: ["come on", "strike me now...", "there is nothing they can do", "punishment"],
            receive_surge: ["they will not see this coming", "i will handle this", "i will strike twice"],
            receive_empowered: ["they will be sludge", "they will be crushed", "they will not stand for long"],
            give_vulnerable: ["hit them now", "i see them", "they are vulnerable", "now crush them"],
            give_redirection: ["stay behind", "look at me!", "hit ME!", "i am here!"],
            give_fear: ["you cannot hurt me"]
  };
//Cavik
  env.COMBAT_ACTORS.cavik.reactions = {
            receive_hit: ["ow!!"],
            receive_crit: ["ow, ow!!!"],
            receive_puncture: ["Ff#$", "@#Æ$J", "oh no...", "dammit!", "they hit me!"],
            receive_destabilized: ["it hurts", "hurts", "i feel you", "pleas e", "they are everywhere"],
            receive_fear: ["akizet!!", "keep it away from me!", "h--help me!", "no, no no no", "stay back! stay back!",
                      ()=> env.rpg.is2D ? "speak no more! please!" : "i... i remember you..."],
            receive_stun: ["Ahg!", "ÇæÙ‡ß†!", "st-!"],
            receive_vulnerable: ["it is looking at me!", "stop it!", "help!", "help me!", "they are coming for me!"],
            receive_weakened: ["i feel sick", "my bombs!", "i do not feel good", "my bombs are dulled!"],
            receive_open_wound: ["i need help!", "i am badly hurt!", "i-i am exposed!"],
            receive_rot: ["th-this is!", "get this off me!", "it is eating at my body!"],
            dead: ["ak-!", "sto-!", "Aa-!"],
            evade: ["oh!!", "what?!"],
            puncture: ["i need to seal this!", "s-should be a simple fix...", "i am bleeding!"],
            destabilized: ["someone is there", "i cannot wake up", "who are you?", "you have to end this"],
            stun: ["whhaahh", "..."],
            regen: ["coming together again!", "regenerating!", "healing wounds!", "alright!"],
            crit: ["i got you!", "catch!", "boom!", "right where it hurts!", "yes!"],
            miss: ["ah!", "no!", "missed!!"],
            crit_buff: ["this should help!", "have this!"],
            receive_buff: ["thank you!"],
            receive_rez: ["what happened?!", "i am back..?"],
            receive_carapace: ["what is this made of?"],
            receive_repairs: ["thank you!", "shields up!", "protection!"],
            receive_redirection: ["be careful!", "i will cover you!", "i will shield you!",
                                () => env.rpg?.lastAction?.user?.slug ? `stay close ${env.rpg?.lastAction?.user?.name?.toLowerCase()}!` : "stay close!"],
            receive_focus: ["i know what to do", "i can do this", "i know where to strike"],
            receive_evasion: ["you will not catch me", "i am as ready as can be"],
            receive_regen: ["together!", "already feeling better!", "thank you! thank you!",
                          () => env.rpg?.lastAction?.user?.slug ? `thank you ${env.rpg?.lastAction?.user?.name?.toLowerCase()}!` : "thank you!"],
            receive_spikes: ["spiky!", "spikes are up!"],
            receive_surge: ["stand back!", "get ready!", "doubling the bombs!"],
            receive_empowered: ["watch this!", "a bigger boom!"],
            give_vulnerable: ["do you see those spots?", "their shell is vulnerable", "you can hit them there!"],
            give_redirection: ["thank you!!", "i will cover you!", "i-i will protect you!", "i got this!"],
            give_fear: ["your time to detonate"]
  };
//Itzil-Karik Golem
   env.COMBAT_ACTORS.ikgolem.reactions = {
            receive_hit: ["@#Æ$J", "Ff#$"],
            receive_crit: ["how--?!"],
            receive_puncture: ["Ff#$", "the chassis!!", "they pierced the armor!"],
            receive_destabilized: ["something is so wrong...", "i do not like this",
              ()=> env.rpg.is2D ? "we will sludge them all" : "i will sludge them all"],
            receive_fear: [()=> env.rpg.is2D ? "i am not stopping!" : "i feel sick...",
              ()=> env.rpg.is2D ? "YOU DID THIS TO US" : "what did this to you?!"],
            receive_stun: ["Ah-!", "woh!", "it hit hard!"],
            receive_vulnerable: ["it is targeting me?", "just try it", "bad choice"],
            receive_weakened: ["the gauntlets!"],
            receive_open_wound: ["they broke through?",
              ()=> env.rpg.is2D ? "our shell has cracked!" : "my shell has cracked!"],
            receive_rot: ["something has taken hold!", "get it off! get it off!"],
            dead: ["no! get up, get up!", "the body is not responding!!", "it took critical damage!"],
            evade: ["stop that!", "deflected!"],
            puncture: ["losing cohesion fast!", "not good!"],
            destabilized: ["how do i stop this?",
                      ()=> env.rpg.is2D ? "what is going on?" : "itzil?"],
            stun: ["it will not respond!!",
                  ()=> env.rpg.is2D ? "we cannot control it!" : "i cannot control it!"],
            regen: ["much better"],
            crit: ["ahaha...", "incredible!"],
            miss: ["÷°ò!!", "lucky you", "next time", "kelnit!", "kequvi!"],
            crit_buff: ["i hope that helps!"],
            receive_buff: ["excellent"],
            receive_rez: ["ah, it works again!", "back at it!", "it is gonna take more than that!", "functional again!"],
            receive_carapace: ["more armor! yes!", "untouchable!"],
            receive_repairs: [()=> env.rpg.is2D ? "we will put it to use" : "thank you, thank you"],
            receive_redirection: ["what?", "unnecessary, but thanks"],
            receive_focus: [()=> env.rpg.is2D ? "soon..." : "i know where to strike"],
            receive_evasion: ["it is not all about speed", "big AND nimble", "you thought this would be easy?"],
            receive_regen: [() => env.rpg?.lastAction?.user?.slug ? `thank you ${env.rpg?.lastAction?.user?.name?.toLowerCase()}` : "thank you",
              ()=> env.rpg.is2D ? "going to need more" : "appreciated!"],
            receive_spikes: [()=> env.rpg.is2D ? "come at us!" : "come at me!"],
            receive_surge: [()=> env.rpg.is2D ? "they will DIE" : "they will be dust"],
            receive_empowered: ["even stronger still",
                          ()=> env.rpg.is2D ? "we will CRUSH them" : "i will crush them"],
            receive_windup: [()=> env.rpg.is2D ? "charging!" : "charging..."],
            give_vulnerable: ["you know what to do"],
            give_redirection: [()=> env.rpg.is2D ? "i got you!" : "we got you!", ()=> env.rpg.is2D ? "we got this" : "i got this", "protecting!"],
            give_fear: ["DIE!!"]
  };
//
//Rooms
//

//
//Enemy Encounters
//Tutorial
  env.COMBAT_FORMATIONS.tutorial_golem.enemies = ["container_evader", "personnel_veilklight", "basic_golem", "basic_golem", "personnel_veilklight", "container_evader"];
//Recreation
  env.COMBAT_FORMATIONS.recreation_survival.enemies = ["listener", "personnel_veilklight", "container_sfer", "personnel_attendant"];
//Personnel
  env.COMBAT_FORMATIONS.personnel_attendant.enemies = ["personnel_veilklight", "personnel_veilklight", "bstrdlight", "personnel_attendant", "kivskin"];
//Movefoe
  env.COMBAT_FORMATIONS.movefriend_survival.enemies = ["movefoe_tendrils", "movefoe_driver", "movefoe_relay", "movefoe_tendrils"];

//Evil Mode tutorial
  env.COMBAT_FORMATIONS.archive_intro.enemies = ["bstrdlight", "maintcloak", "container_evader", "archival_golem", "kivskin"];
//Main
  env.COMBAT_FORMATIONS.archivecommon.enemies = ["bstrdlight", "husk_support", "maintcloak", "personnel_attendant", "husk_guard"];
  env.COMBAT_FORMATIONS.archivecloaktainer.enemies = ["bstrdlight", "surgeon_golem", "husk_observer", "maintcloak", "husk_striker"];
//Left
  env.COMBAT_FORMATIONS.archivedouble.enemies = ["bstrdlight", "bstrdlight", "maintcloak", "archival_golem", "archival_golem"];
//Right
  env.COMBAT_FORMATIONS.archivecontainers.enemies = ["listener", "bstrdlight", "container_sfer", "container_sfer", "container_exploder", "container_exploder"];
//Bosses
  env.COMBAT_FORMATIONS.archiveshelfminiboss.enemies = ["bstrdlight", "bstrdshelf", "maintcloak"];
  env.COMBAT_FORMATIONS.bstrdboss.enemies = ["maintcloak", "bstrdboss", "bstrdboss_lowintensity", "bstrdlight"];

//Golem Personnel

//Lobby

//Dullzica

//Dozkallvi

//Translation Core

  }});
