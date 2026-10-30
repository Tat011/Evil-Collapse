document.addEventListener('corru_resources_added', ()=>{
  if (page.path == "/local/beneath/embassy/" || page.path == "/local/ocean/embassy/" || page.path == "/local/ocean/embassy/golem/" || page.path == "/local/ocean/embassy/groundsmindry/"){
//
//Moves
//Stab (Akizet/husk)
  env.ACTIONS.stab = {
        slug: "stab",
        name: "Stab",
        type: 'target',
        anim: "basic-attack",

        usage: {
            act: "%USER STABS %TARGET",
            crit: "%TARGET IS EVISCERATED",
            hit: "%TARGET BLEEDS SLUDGY CORRU",
            miss: "%TARGET EVADES"
        },

        details: {
            flavor: "'reshape arm into sharpened tendril';'stab target'",
            onHit: `'[STAT::amt] [STATUS::puncture]'`,
            onCrit: ()=> `'puncture vital cystic component for [STATUS::open_wound]'${env?.rpg?.is2D ? ";'KB::2'" : ''}`,
        },

        stats: {
            range: 2,
            accuracy: 1,
            crit: 0.1,
            amt: 1,
            status: {
                puncture: {
                    name: 'puncture',
                    length: 3
                },
                open_wound: {
                    name: 'open_wound',
                    length: 2
                }
            }
        },

        targeting: "angular",
        aoe: { 
            size: 2, 
            shape: "line-from",
            canHit: (user, target) => { return true } 
        },
        
        exec: function(user, target) {
            return env.GENERIC_ACTIONS.singleTarget({
                action: this, 
                user, 
                target,
                hitSfx: {
                    name: 'stab',
                    rate: 1
                },
                critStatus: {
                    name: this.stats.status.open_wound.name,
                    length: this.stats.status.open_wound.length
                },
                hitStatus: {
                    name: this.stats.status.puncture.name,
                    length: this.stats.status.puncture.length
                }, 
                critExec: ({target})=>{ // has a knockback in combat-scene on crit
                    if(env?.rpg?.is2D) {
                        if(target.piece && user.piece) target.piece.knockback({
                            direction: user?.piece?.tile.getRelativeDirection(target?.piece?.tile), 
                            strength: 2, 
                            onImpact: ()=> play("hit", 0.5)
                        });
                    }
                }
            });
        },
    };
//Destabilize (the Gakk)

//Skitter (container) Evasion 1 turns to 3
  env.ACTIONS.skitter = {
        slug: "skitter",
        name: "Skitter",
        type: 'autohit',
        anim: "skitter",
        usage: {
            act: "%USER SKITTERS WILDLY AROUND THE ROOM"
        },
        details: {
            onUse: () => `'gain [STATUS::evasion]'`,
            flavor: "'focus on evading incoming attacks';'hide vulnerabilities'"
        },
        stats: {
            status: {
                evasion: {
                    name: 'evasion',
                    length: 3
                },
            }
        },
        exec: function(user, target) {
            addStatus({target: user, status: "evasion", length: 3, noReact: true}); 
            return 'nothing';
        },
        avoidChaining: true,
        enemyUsageIf: (actor) => { return actor.hp < actor.maxhp },
        disableIf: (actor)=>{ if(hasStatus(actor,"fear")) return "PROHIBITED BY FEAR" }
    };
//Self Destruct (Basic Golem) accuracy 50% to 75%
  env.ACTIONS.special_self_destruct.stats = {
    accuracy: 0.75,
    amt: 1,
  };
//Beserk (Golem)
  env.ACTIONS.berserk = {
        slug: "berserk",
        name: "Berserk",
        type: 'autohit',
        help: "+2T:DESTABILIZE +2T:SPIKES +2T:CARAPACE",
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
            addStatus({target: user, status: "spikes", length: 2, noReact: true}); 
            addStatus({target: user, status: "carapace", length: 2, noReact: true}); 
            return 'nothing';
        },
    };
//Movefriend Attack
  env.ACTIONS.incoherent_movefriend = {
        slug: "incoherent_movefriend",
        name: "Wallspikes",
        type: 'special',
        help: "BATTLEFIELD 300% -1HP",
        desc: "'kÌ¶Ì‡Ì„Ì¡iÌµÍÍ‘Ì•ÌÌ‘ÌŒÍ„Ì‡Ì¾ÍˆlÌ·Ì½Ì‚Ì¿ÌÍ’ÌŽÌ½ÌÍ€Ì¿ÌÌ…ÌˆÍ“Ì¬Ì¡Ì©Ì–lÌµÍ Ì¯Ì¦Ìª'",
        accuracy: 1,
        crit: 0,
        exec: function(user, target) {
            addStatus({target: user, status: "incoherent", length: 1, noReact: true});
            if(user.state == "lastStand") actionMessage(user, "THE WALLS TWIST AROUND THE WHOLE TEAM", target);
            else actionMessage(user, "THE WALLS SHIFT AROUND %TARGET", target);
            //vortex on screen, circle expands into fullscreen bg (animation in CSS)
            env.rpg.insertAdjacentHTML('beforeend', `
                <div class="golem-vortex bh-action-${user.slug} bh-action"></div>
                <div id="${user.slug}-bh" class="bh-action-${user.slug} bh-action">
                    <div class="bh_damage-wrapper"></div>
                </div>
            `);
            env.rpg.vortex = document.querySelector(`.golem-vortex.bh-action-${user.slug}`);
            env.rpg.actionZone = document.querySelector(`#${user.slug}-bh`);
            //animate the vortex
            setTimeout(()=>{
                env.rpg.vortex.classList.add('active');
                //we should set this up so that on last stand, it randomly targets the whole (living) team
                //additionally, it should end early on full death
                bh_start({
                    playerEl: `<div id="bh_player" class="notice" style="background-image:url(${target.portraitUrl})"></div>`, 
                    onHit: () => {
                        var hit;
                        if(user.state == "lastStand") {
                            let possibleTargets = env.rpg.allyTeam.members.filter(member => member.hp > 0);
    
                            if(possibleTargets.length == 0) env.bulletHell.complete();
                            hit = combatHit(possibleTargets[rand(0, possibleTargets.length)], {amt: 3, acc: 2, crit: 0, origin: user});
                            if(hit) play('hit', 1.5, 0.5); else play("miss", 1.25, 0.5);
                            
                        } else if(target.state != "dead") {
                            hit = combatHit(target, {amt: 3, acc: 2, crit: 0, origin: user});
                            if(hit) play('hit', 1.5, 0.5); else play("miss", 1.25, 0.5);
                            if(target.hp == 0) env.bulletHell.complete();
                        } else {
                            env.bulletHell.complete();
                        }
    
                        if(hit == false) return "dodged"; else return "damaged";
                    }
                });
                //animation done, activate ze game
                setTimeout(()=>{
                    body.classList.add('in-golem-vortex');
                    env.rpg.actionZone.classList.add('active');
                    document.querySelector(`#bh_player`).classList.add('active');
                    //changes moves based on health - string refers to the urgency with which he shoots, missing more the lower his HP is but creating more hazards that way
                    if(!user.tutorial) {
                        startDialogue("d3_movespecial");
                        user.tutorial = true;
                    } else if(user.state == "lastStand") { //0 hp
                        bh_movefriend({level: "last stand", duration: 70000});
                    } else if (user.hp < (0.50 * user.maxhp)) { //low HP
                        bh_movefriend({level: "threatened"});
                    } else { //high HP 
                        bh_movefriend({level: "healthy"});
                    }
                }, 500);

                setTimeout(()=>{
                    env.rpg.classList.add('cull');
                }, 1500);
            }, env.ADVANCE_RATE * 0.5);
        }
    };
//Annihilation (The pain itshelf)
  env.ACTIONS.special_archiveshelf_annihilate = {
        slug: "special_archiveshelf_annihilate",
        name: "Annihilation",
        type: 'special+nomimic',
        desc: "'utilize long limbs to eviscerate a target'",
        anim: "wobble",
        choiceAnim: "special_choice-movefriend",
        choiceAnimDuration: 200,
        help: "CHOOSE::100% -2HP +1T:ROT +1T:PUNCTURE ::OR:: 50% -2HP +1T:STUN +3T:ROT +3T:PUNCTURE",
        usage: {
            act: "%USER LUNGES AT %TARGET",
            crit: "%TARGET IS BRUTALLY STABBED",
            hit: "%TARGET TAKES A SOLID HIT",
            miss: "%TARGET ESCAPED BY A HAIR"
        },
        details: {
            onUse: `'present target foe a choice of outcome'`,
            conditional: `<em>HIT 1</em>::'HIT::[STAT::hit1ACC]% [STAT::hit2HP]';'[STATUS::hitpuncture] [STATUS::hitrot]'\n<em>HIT 2</em>::'HIT::[STAT::hit2ACC]% [STAT::hit2HP]';'[STATUS::stun] [STATUS::critpuncture] [STATUS::critrot]'`
        },
        stats: {
            hit1HP: 3,
            hit1ACC: 100,
            hit2HP: 3,
            hit2ACC: 50,
            hit2CRIT: 50,
            status: {
                stun: { name: 'stun', length: 1 },
                hitpuncture: { name: 'puncture', length: 1 },
                critpuncture: { name: 'puncture', length: 3 },
                hitrot: { name: 'rot', length: 1 },
                critrot: { name: 'rot', length: 3 }
            },
        },
        noRepeat: true,
        exec: function(user, target) {
            user.sprite.classList.add('special_choice-movefriend');
            let action = this;
            //summon a div that lets the player click guaranteed or chance
            actionChoice({
                user: user,
                action: action,
                choiceText: `The shelf lunges at ${target.name}...`,
                options: [
                    {text: "Withstand the attack", definition: "NOTE::'100% -2HP +1T:ROT +1T:PUNCTURE'"},
                    {text: "Try a risky dodge", definition: "NOTE::'50% -2HP +1T:STUN +3T:ROT +3T:PUNCTURE'"},
                ],
                choiceCallback: (c) => {
                    //reap the consequences
                    user.sprite.classList.add(action.anim);
                    var hit;
                    switch(c) {
                        case "c0":
                            hit = combatHit(target, {amt: 2, acc: 1, crit: 0, origin: user});
                            break;
                        case "c1":
                            hit = combatHit(target, {amt: 2, acc: 0.5, crit: 1, origin: user});
                            break;
                    }
                    actionMessage(user, action, target, hit);
                    switch(hit) {
                        case "crit":                                
                            playCombatCrit();
                            addStatus({target: target, origin: user, status: "stun", length: 1});
                            addStatus({target: target, origin: user, status: "puncture", length: 3, noReact: true});
                            addStatus({target: target, origin: user, status: "rot", length: 3, noReact: true});
                            removeStatus(target, "windup");
                            break;
                        case true:
                            reactDialogue(target, 'receive_hit');
                            addStatus({target: target, origin: user, status: "puncture", length: 1, noReact: true});
                            addStatus({target: target, origin: user, status: "rot", length: 1, noReact: true});
                            play("stab", 0.75);
                            break;
                        case false:
                            reactDialogue(target, 'evade');
                            play("miss", 0.75);
                            break;
                    }
                    setTimeout(()=> user.sprite.classList.remove(action.anim), 600);
                    setTimeout(()=>advanceTurn(user), env.ADVANCE_RATE);
                }
            });
        }
    };
//Barrier (Constructor)
  env.ACTIONS.barrier = {
        slug: "barrier",
        name: "Barrier",
        verb: "shield",
        type: 'support+target+self+autohit',
        anim: "heal",
        usage: {
            act: "%USER SHIELDS %TARGET",
            crit: "%TARGET FEELS INVINCIBLE",
            hit: "%TARGET GAINS A THIN BARRIER",
            miss: "IT DOES NOT STICK"
        },
        details: {
            flavor: "apply ablative corru layer to target';'occasionally provide better shielding'",
            onHit: `'[STAT::amtBP]'`,
            onCrit: `'additional [STAT::amtBP]'`,
        },
        stats: {
            crit: 0.1,
            amt: 3,
            amtBP: 3
        },
        autohit: true,
        exec: function(user, target) {
            return env.GENERIC_ACTIONS.singleTarget({
                beneficial: true,
                type: 'barrier',
                action: this, 
                user, 
                target,
                hitSfx: {
                    name: 'mend',
                    rate: 1.5
                },
            });
        }
    };
//Special chant (Translation Core)
  env.ACTIONS.special_chant = {
        slug: "special_chant",
        name: "â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ",
        type: 'special+summon',
        desc: "'â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ â–ˆâ–ˆâ–ˆ â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ';'convey malignant thoughtforms via speech'",
        help: "FOES::80% -1HP, 40% x2 +1T:WEAKENED SUMMON::+1 HALLUCINATION (MAX:4)",
        anim: "orbshake",
        accuracy: 0.8,
        crit: 0.5,
        amt: 1,
        usage: {
            act: "%USER â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ â–ˆâ–ˆâ–ˆ â–ˆâ–ˆâ–ˆâ–ˆâ–ˆ"
        },
        noRepeat: true,
        exec: function(user, target, beingUsedAsync) {
            let action = this;
            
            user.sprite.classList.add('orbshake');
            setTimeout(function(){user.sprite.classList.remove('orbshake')}, 1200);

            env.GENERIC_ACTIONS.teamWave({
                team: user.enemyTeam,
                exec: (actor, i) => {
                    env.GENERIC_ACTIONS.singleTarget({
                        action: action, 
                        user, 
                        target: actor,
                        hitSfx: { name: 'talksignal' },
                        critSfx: { name: 'fear', rate: 0.75 },
                        critStatus: {
                            name: 'weakened',
                            length: 1
                        },
                        critExec: ({target}) => {
                            user.lastSide = !user.lastSide;
                            env.hallucinator = target.slug;
                            if(env.hallucinator == "ikgolem" && env.ep4) env.hallucinator = "ikgolem_ep4";
                            if(user.team.members.filter(m=>m.slug.includes('hallucination')).length < 4) {
                                midCombatActorAdd(env.rpg.enemyTeam, 'hallucination', user.lastSide ? "left" : "right");
                            }
                        }
                    });
                },
                advanceAfterExec: true, beingUsedAsync, user,
            });
        }
    };
//Dull Container Brawl
  env.ACTIONS.brawl_weak = {
        slug: "brawl_weak",
        name: "Clumsy Brawl",
        verb: "brawl with",
        type: 'target',
        desc: "'unwieldy strike with weak limbs'",
        anim: "basic-attack",
        help: "40% -1HP, 10%C X2",
        usage: {
            act: "%USER CLUMSILY ATTACKS %TARGET",
            crit: "%TARGET IS KNOCKED BACK",
            hit: "%TARGET IS STRUCK",
            miss: "%TARGET EVADES"
        },
        accuracy: 0.6,
        crit: 0.10,
        amt: 1,
        exec: function(user, target) {
            return env.GENERIC_ACTIONS.singleTarget({
                action: this, 
                user, 
                target,
            })
        }
    };
//
//Enemies
//Container (Dodge specialist)
  env.COMBAT_ACTORS.container = {
        name: "Container",
        maxhp: 8,
        hp: 8,
        actions: ["attack", "skitter", "skitter"],
        graphic: `
            <div class="sprite-wrapper" id="%SLUG-sprite-wrapper">
                <img class="sprite" src="/img/sprites/combat/foes/inc.gif" id="%SLUG-sprite">
                <div class="target" entity="hostile container"></div>
            </div>
            `,
    reactions: {//Text the container carries
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
            receive_buff: ["Ã†ffic1Å’nt coopÃ†rÃ¦4ion iÂ§ the", "the bÂ©oÂ§t was enough for"],
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
    },
    turnCheck: "container"
  };

//VeilkLight (Vulnerable and heal specialist)
//  env.COMBAT_ACTORS.container.reactions = {

//Attendant (bleed and other status specialist)
  env.COMBAT_ACTORS.attendant = {
        name: "Spire Attendant",
        maxhp: 12,
        hp: 12,
        actions: ["primary", "foe_stab", "evade"],
        graphic: `
            <div class="sprite-wrapper" id="%SLUG-sprite-wrapper">
                <div class="attendant-sprite">
                    <img class="sprite" src="/img/local/embassy/spiredronebody.gif" id="%SLUG-sprite">
                </div>
                <div class="target" entity="attendant"></div>
            </div>
            `,
        reactions: {
            receive_hit: ["1UiÃ«2Wâ€¡", "â€¡eÃŽKÃŸJÃ¤Ã¤", "/â€¦Â¿?Ã· Ã´LÃ£Ã˜", "CÂ©Ã‹", "0Eâ„¢NÃ³Â¨Ã½QÃ’", "â‚¬LWÃ©{Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "Â£~UÃ¾fÃ¢", "â€¦TÃº**"],
            receive_crit: ["themÂ±yâ„¢ÂÂ£Vâ€ ", "Ã±a3Ã™Ã¦mÃªÃ“ÂÂ§Â°ÃœÃ·ÃŸR", "ÂÃ·Â²ave rs i onÂ¬_.g?Ã§", ")Â§=XÂ«vÅ¡rpersÂ®Â¿Ã¦ÂshÃžÂ»"],
            receive_puncture: ["tHÂ¾ cÂ©râ€¹Ãœ", "hÃœÂ±ger", "%y0#Ãºu", "â‚¬^EÂ¿ythin8"],
            receive_destabilized: ["Ã‰â€¦VE  rÃ½Ã’;-nÃ‹", "t#8â€¡  thÄ›r", "Â©NÂ£ aÂ¤d mÃ†^Â¥", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã"],
            receive_fear: ["iÃ·Â¾(ÃÃ¹ a mÂ¯Â¯]..â€ r+Ã½Ã·^Ã¦nG", "zÃ›Â¾uc/I!", "TRÃ½Â¦NG"],
            receive_stun: ["Â¦(Ã›Âc\Â½â€°still time still  ti #*Ã«Â²`t hÃ†^â‚¬", " Â¤Â±Ã’Ã¿=WA ST ING %â€°Â¶Å¡ TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s^Ã‹Â£", "Â¤Ã‚Ã¦Â©ceded contr@Â¦", "cÃ˜ntrÂ©l"],
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
            receive_redirection: ["â€¡ogether ÃƒqIÃ¼Ã‘Â±Ãºâ‚¬Ã—Ã°Ã¿}?}Å“Ãˆ?ÂÂ±", "f/Nn@<Â¥ awÃƒÂ¦e", "c0aL*sâ‚¬Â£`"],
            receive_focus: ["}Ã­speaks clearlyÃ¿B  utÂ²Ã¥Ã¿Â±Ã¡", "t% fÃ’c8s"],
            receive_evasion: ["ÃŸRÄ›Â¿^red"],
            receive_regen: ["tÂ£@M", "r<PÃ¦Â¦rs"],
            receive_spikes: ["[Â¶Ã¿=>drastic measure)%â€°", "awÃƒÂ¥"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["IÃœ4â€¡Ã¾Ã¸Ã¯aÃ¸know what must be done"],
            give_vulnerable: ["L I S T E   NbÅ ÃžÃaÃ¼1", "L I  S T E N   "],
            give_redirection: ["R E TU RN", "S  T O P"],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
        }
    };
//MoveFoe
  env.COMBAT_ACTORS.enemy_movefriend.reactions = {
            receive_hit: ["1UiÃ«2Wâ€¡", "â€¡eÃŽKÃŸJÃ¤Ã¤", "/â€¦Â¿?Ã· Ã´LÃ£Ã˜", "CÂ©Ã‹", "0Eâ„¢NÃ³Â¨Ã½QÃ’", "â‚¬LWÃ©{Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "Â£~UÃ¾fÃ¢", "â€¦TÃº**"],
            receive_crit: ["themÂ±yâ„¢ÂÂ£Vâ€ ", "Ã±a3Ã™Ã¦mÃªÃ“ÂÂ§Â°ÃœÃ·ÃŸR", "ÂÃ·Â²ave rs i onÂ¬_.g?Ã§", ")Â§=XÂ«vÅ¡rpersÂ®Â¿Ã¦ÂshÃžÂ»"],
            receive_puncture: ["tHÂ¾ cÂ©râ€¹Ãœ", "hÃœÂ±ger", "%y0#Ãºu", "â‚¬^EÂ¿ythin8"],
            receive_destabilized: ["Ã‰â€¦VE  rÃ½Ã’;-nÃ‹", "t#8â€¡  thÄ›r", "Â©NÂ£ aÂ¤d mÃ†^Â¥", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã"],
            receive_fear: ["iÃ·Â¾(ÃÃ¹ a mÂ¯Â¯]..â€ r+Ã½Ã·^Ã¦nG", "zÃ›Â¾uc/I!", "TRÃ½Â¦NG"],
            receive_stun: ["Â¦(Ã›Âc\Â½â€°still time still  ti #*Ã«Â²`t hÃ†^â‚¬", " Â¤Â±Ã’Ã¿=WA ST ING %â€°Â¶Å¡ TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s^Ã‹Â£", "Â¤Ã‚Ã¦Â©ceded contr@Â¦", "cÃ˜ntrÂ©l"],
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
            receive_redirection: ["â€¡ogether ÃƒqIÃ¼Ã‘Â±Ãºâ‚¬Ã—Ã°Ã¿}?}Å“Ãˆ?ÂÂ±", "f/Nn@<Â¥ awÃƒÂ¦e", "c0aL*sâ‚¬Â£`"],
            receive_focus: ["}Ã­speaks clearlyÃ¿B  utÂ²Ã¥Ã¿Â±Ã¡", "t% fÃ’c8s"],
            receive_evasion: ["ÃŸRÄ›Â¿^red"],
            receive_regen: ["tÂ£@M", "r<PÃ¦Â¦rs", "t#Ã†-wâ‚¬"],
            receive_spikes: ["[Â¶Ã¿=>drastic measure)%â€°", "awÃƒÂ¥"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["IÃœ4â€¡Ã¾Ã¸Ã¯aÃ¸know what must be done"],
            give_vulnerable: ["L I S T E   NbÅ ÃžÃaÃ¼1", "L I  S T E N   "],
            give_redirection: ["R E TU RN", "S  T O P"],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
  };
  env.COMBAT_ACTORS.enemy_movefriend_lowintensity.reactions = {
            receive_hit: ["1UiÃ«2Wâ€¡", "â€¡eÃŽKÃŸJÃ¤Ã¤", "/â€¦Â¿?Ã· Ã´LÃ£Ã˜", "CÂ©Ã‹", "0Eâ„¢NÃ³Â¨Ã½QÃ’", "â‚¬LWÃ©{Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "Â£~UÃ¾fÃ¢", "â€¦TÃº**"],
            receive_crit: ["themÂ±yâ„¢ÂÂ£Vâ€ ", "Ã±a3Ã™Ã¦mÃªÃ“ÂÂ§Â°ÃœÃ·ÃŸR", "ÂÃ·Â²ave rs i onÂ¬_.g?Ã§", ")Â§=XÂ«vÅ¡rpersÂ®Â¿Ã¦ÂshÃžÂ»"],
            receive_puncture: ["tHÂ¾ cÂ©râ€¹Ãœ", "hÃœÂ±ger", "%y0#Ãºu", "â‚¬^EÂ¿ythin8"],
            receive_destabilized: ["Ã‰â€¦VE  rÃ½Ã’;-nÃ‹", "t#8â€¡  thÄ›r", "Â©NÂ£ aÂ¤d mÃ†^Â¥", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã"],
            receive_fear: ["iÃ·Â¾(ÃÃ¹ a mÂ¯Â¯]..â€ r+Ã½Ã·^Ã¦nG", "zÃ›Â¾uc/I!", "TRÃ½Â¦NG"],
            receive_stun: ["Â¦(Ã›Âc\Â½â€°still time still  ti #*Ã«Â²`t hÃ†^â‚¬", " Â¤Â±Ã’Ã¿=WA ST ING %â€°Â¶Å¡ TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s^Ã‹Â£", "Â¤Ã‚Ã¦Â©ceded contr@Â¦", "cÃ˜ntrÂ©l"],
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
            receive_redirection: ["â€¡ogether ÃƒqIÃ¼Ã‘Â±Ãºâ‚¬Ã—Ã°Ã¿}?}Å“Ãˆ?ÂÂ±", "f/Nn@<Â¥ awÃƒÂ¦e", "c0aL*sâ‚¬Â£`"],
            receive_focus: ["}Ã­speaks clearlyÃ¿B  utÂ²Ã¥Ã¿Â±Ã¡", "t% fÃ’c8s"],
            receive_evasion: ["ÃŸRÄ›Â¿^red"],
            receive_regen: ["tÂ£@M", "r<PÃ¦Â¦rs", "t#Ã†-wâ‚¬"],
            receive_spikes: ["[Â¶Ã¿=>drastic measure)%â€°", "awÃƒÂ¥"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["IÃœ4â€¡Ã¾Ã¸Ã¯aÃ¸know what must be done"],
            give_vulnerable: ["L I S T E   NbÅ ÃžÃaÃ¼1", "L I  S T E N   "],
            give_redirection: ["R E TU RN", "S  T O P"],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
  };
//Archival Golem
  env.COMBAT_ACTORS.archival_golem.reactions = {
            receive_hit: ["1UiÃ«2Wâ€¡", "â€¡eÃŽKÃŸJÃ¤Ã¤", "/â€¦Â¿?Ã· Ã´LÃ£Ã˜", "CÂ©Ã‹", "0Eâ„¢NÃ³Â¨Ã½QÃ’", "â‚¬LWÃ©{Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "Â£~UÃ¾fÃ¢", "â€¦TÃº**"],
            receive_crit: ["themÂ±yâ„¢ÂÂ£Vâ€ ", "Ã±a3Ã™Ã¦mÃªÃ“ÂÂ§Â°ÃœÃ·ÃŸR", "ÂÃ·Â²ave rs i onÂ¬_.g?Ã§", ")Â§=XÂ«vÅ¡rpersÂ®Â¿Ã¦ÂshÃžÂ»"],
            receive_puncture: ["tHÂ¾ cÂ©râ€¹Ãœ", "hÃœÂ±ger", "%y0#Ãºu", "â‚¬^EÂ¿ythin8"],
            receive_destabilized: ["Ã‰â€¦VE  rÃ½Ã’;-nÃ‹", "t#8â€¡  thÄ›r", "Â©NÂ£ aÂ¤d mÃ†^Â¥", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã"],
            receive_fear: ["iÃ·Â¾(ÃÃ¹ a mÂ¯Â¯]..â€ r+Ã½Ã·^Ã¦nG", "zÃ›Â¾uc/I!", "TRÃ½Â¦NG"],
            receive_stun: ["Â¦(Ã›Âc\Â½â€°still time still  ti #*Ã«Â²`t hÃ†^â‚¬", " Â¤Â±Ã’Ã¿=WA ST ING %â€°Â¶Å¡ TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s^Ã‹Â£", "Â¤Ã‚Ã¦Â©ceded contr@Â¦", "cÃ˜ntrÂ©l"],
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
            receive_redirection: ["â€¡ogether ÃƒqIÃ¼Ã‘Â±Ãºâ‚¬Ã—Ã°Ã¿}?}Å“Ãˆ?ÂÂ±", "f/Nn@<Â¥ awÃƒÂ¦e", "c0aL*sâ‚¬Â£`"],
            receive_focus: ["}Ã­speaks clearlyÃ¿B  utÂ²Ã¥Ã¿Â±Ã¡", "t% fÃ’c8s"],
            receive_evasion: ["ÃŸRÄ›Â¿^red"],
            receive_regen: ["tÂ£@M", "r<PÃ¦Â¦rs", "t#Ã†-wâ‚¬"],
            receive_spikes: ["[Â¶Ã¿=>drastic measure)%â€°", "awÃƒÂ¥"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["IÃœ4â€¡Ã¾Ã¸Ã¯aÃ¸know what must be done"],
            give_vulnerable: ["L I S T E   NbÅ ÃžÃaÃ¼1", "L I  S T E N   "],
            give_redirection: ["R E TU RN", "S  T O P"],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
  };
//Jutskin
  env.COMBAT_ACTORS.maintcloak.reactions = {
            receive_hit: ["1UiÃ«2Wâ€¡", "â€¡eÃŽKÃŸJÃ¤Ã¤", "/â€¦Â¿?Ã· Ã´LÃ£Ã˜", "CÂ©Ã‹", "0Eâ„¢NÃ³Â¨Ã½QÃ’", "â‚¬LWÃ©{Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "Â£~UÃ¾fÃ¢", "â€¦TÃº**"],
            receive_crit: ["themÂ±yâ„¢ÂÂ£Vâ€ ", "Ã±a3Ã™Ã¦mÃªÃ“ÂÂ§Â°ÃœÃ·ÃŸR", "ÂÃ·Â²ave rs i onÂ¬_.g?Ã§", ")Â§=XÂ«vÅ¡rpersÂ®Â¿Ã¦ÂshÃžÂ»"],
            receive_puncture: ["tHÂ¾ cÂ©râ€¹Ãœ", "hÃœÂ±ger", "%y0#Ãºu", "â‚¬^EÂ¿ythin8"],
            receive_destabilized: ["Ã‰â€¦VE  rÃ½Ã’;-nÃ‹", "t#8â€¡  thÄ›r", "Â©NÂ£ aÂ¤d mÃ†^Â¥", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã"],
            receive_fear: ["iÃ·Â¾(ÃÃ¹ a mÂ¯Â¯]..â€ r+Ã½Ã·^Ã¦nG", "zÃ›Â¾uc/I!", "TRÃ½Â¦NG"],
            receive_stun: ["Â¦(Ã›Âc\Â½â€°still time still  ti #*Ã«Â²`t hÃ†^â‚¬", " Â¤Â±Ã’Ã¿=WA ST ING %â€°Â¶Å¡ TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s^Ã‹Â£", "Â¤Ã‚Ã¦Â©ceded contr@Â¦", "cÃ˜ntrÂ©l"],
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
            receive_redirection: ["â€¡ogether ÃƒqIÃ¼Ã‘Â±Ãºâ‚¬Ã—Ã°Ã¿}?}Å“Ãˆ?ÂÂ±", "f/Nn@<Â¥ awÃƒÂ¦e", "c0aL*sâ‚¬Â£`"],
            receive_focus: ["}Ã­speaks clearlyÃ¿B  utÂ²Ã¥Ã¿Â±Ã¡", "t% fÃ’c8s"],
            receive_evasion: ["ÃŸRÄ›Â¿^red"],
            receive_regen: ["tÂ£@M", "r<PÃ¦Â¦rs", "t#Ã†-wâ‚¬"],
            receive_spikes: ["[Â¶Ã¿=>drastic measure)%â€°", "awÃƒÂ¥"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["IÃœ4â€¡Ã¾Ã¸Ã¯aÃ¸know what must be done"],
            give_vulnerable: ["L I S T E   NbÅ ÃžÃaÃ¼1", "L I  S T E N   "],
            give_redirection: ["R E TU RN", "S  T O P"],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
  };
//Constructor Golem
  env.COMBAT_ACTORS.constructor_golem = {
    name: "Constructor",
    maxhp: 20,
    hp: 20,
    actions: ["primary", "barrier", "spy_analyze", "special_limited_carapace"],
    graphic: `
            <div class="sprite-wrapper constructor-golem golemsprite" id="%SLUG-sprite-wrapper">
                <div class="sprite-overflow spritestack">
                    <img src="/img/sprites/combat/foes/constructor.gif" id="%SLUG-golemsprite-base" class="sprite golemsprite-base">
                    
                    <div class="sprite golemsprite-head">
                        <img src="/img/sprites/combat/foes/constructor-head.gif" id="%SLUG-golemsprite-head">
                    </div>
                    <img src="/img/sprites/combat/foes/constructor-neck.gif" id="%SLUG-golemsprite-neck" class="sprite golemsprite-neck">
                    <img src="/img/sprites/combat/foes/constructor-body.gif" id="%SLUG-golemsprite-body" class="sprite golemsprite-body">
                    <img src="/img/sprites/combat/foes/constructor-arms.gif" id="%SLUG-golemsprite-arms" class="sprite golemsprite-arms">
                </div>

                <div class="target" entity="constructor"></div>
            </div>
            `,
    reactions: {
            receive_hit: ["1UiÃ«2Wâ€¡", "â€¡eÃŽKÃŸJÃ¤Ã¤", "/â€¦Â¿?Ã· Ã´LÃ£Ã˜", "CÂ©Ã‹", "0Eâ„¢NÃ³Â¨Ã½QÃ’", "â‚¬LWÃ©{Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "Â£~UÃ¾fÃ¢", "â€¦TÃº**"],
            receive_crit: ["themÂ±yâ„¢ÂÂ£Vâ€ ", "Ã±a3Ã™Ã¦mÃªÃ“ÂÂ§Â°ÃœÃ·ÃŸR", "ÂÃ·Â²ave rs i onÂ¬_.g?Ã§", ")Â§=XÂ«vÅ¡rpersÂ®Â¿Ã¦ÂshÃžÂ»"],
            receive_puncture: ["tHÂ¾ cÂ©râ€¹Ãœ", "hÃœÂ±ger", "%y0#Ãºu", "â‚¬^EÂ¿ythin8"],
            receive_destabilized: ["Ã‰â€¦VE  rÃ½Ã’;-nÃ‹", "t#8â€¡  thÄ›r", "Â©NÂ£ aÂ¤d mÃ†^Â¥", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã"],
            receive_fear: ["iÃ·Â¾(ÃÃ¹ a mÂ¯Â¯]..â€ r+Ã½Ã·^Ã¦nG", "zÃ›Â¾uc/I!", "TRÃ½Â¦NG"],
            receive_stun: ["Â¦(Ã›Âc\Â½â€°still time still  ti #*Ã«Â²`t hÃ†^â‚¬", " Â¤Â±Ã’Ã¿=WA ST ING %â€°Â¶Å¡ TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s^Ã‹Â£", "Â¤Ã‚Ã¦Â©ceded contr@Â¦", "cÃ˜ntrÂ©l"],
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
            receive_redirection: ["â€¡ogether ÃƒqIÃ¼Ã‘Â±Ãºâ‚¬Ã—Ã°Ã¿}?}Å“Ãˆ?ÂÂ±", "f/Nn@<Â¥ awÃƒÂ¦e", "c0aL*sâ‚¬Â£`"],
            receive_focus: ["}Ã­speaks clearlyÃ¿B  utÂ²Ã¥Ã¿Â±Ã¡", "t% fÃ’c8s"],
            receive_evasion: ["ÃŸRÄ›Â¿^red"],
            receive_regen: ["tÂ£@M", "r<PÃ¦Â¦rs", "t#Ã†-wâ‚¬"],
            receive_spikes: ["[Â¶Ã¿=>drastic measure)%â€°", "awÃƒÂ¥"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["IÃœ4â€¡Ã¾Ã¸Ã¯aÃ¸know what must be done"],
            give_vulnerable: ["L I S T E   NbÅ ÃžÃaÃ¼1", "L I  S T E N   "],
            give_redirection: ["R E TU RN", "S  T O P"],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
    }
  };
//KivSkin
  env.COMBAT_ACTORS.pressure_golem.reactions = {
            receive_hit: ["1UiÃ«2Wâ€¡", "â€¡eÃŽKÃŸJÃ¤Ã¤", "/â€¦Â¿?Ã· Ã´LÃ£Ã˜", "CÂ©Ã‹", "0Eâ„¢NÃ³Â¨Ã½QÃ’", "â‚¬LWÃ©{Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "Â£~UÃ¾fÃ¢", "â€¦TÃº**"],
            receive_crit: ["themÂ±yâ„¢ÂÂ£Vâ€ ", "Ã±a3Ã™Ã¦mÃªÃ“ÂÂ§Â°ÃœÃ·ÃŸR", "ÂÃ·Â²ave rs i onÂ¬_.g?Ã§", ")Â§=XÂ«vÅ¡rpersÂ®Â¿Ã¦ÂshÃžÂ»"],
            receive_puncture: ["tHÂ¾ cÂ©râ€¹Ãœ", "hÃœÂ±ger", "%y0#Ãºu", "â‚¬^EÂ¿ythin8"],
            receive_destabilized: ["Ã‰â€¦VE  rÃ½Ã’;-nÃ‹", "t#8â€¡  thÄ›r", "Â©NÂ£ aÂ¤d mÃ†^Â¥", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã"],
            receive_fear: ["iÃ·Â¾(ÃÃ¹ a mÂ¯Â¯]..â€ r+Ã½Ã·^Ã¦nG", "zÃ›Â¾uc/I!", "TRÃ½Â¦NG"],
            receive_stun: ["Â¦(Ã›Âc\Â½â€°still time still  ti #*Ã«Â²`t hÃ†^â‚¬", " Â¤Â±Ã’Ã¿=WA ST ING %â€°Â¶Å¡ TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s^Ã‹Â£", "Â¤Ã‚Ã¦Â©ceded contr@Â¦", "cÃ˜ntrÂ©l"],
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
            receive_redirection: ["â€¡ogether ÃƒqIÃ¼Ã‘Â±Ãºâ‚¬Ã—Ã°Ã¿}?}Å“Ãˆ?ÂÂ±", "f/Nn@<Â¥ awÃƒÂ¦e", "c0aL*sâ‚¬Â£`"],
            receive_focus: ["}Ã­speaks clearlyÃ¿B  utÂ²Ã¥Ã¿Â±Ã¡", "t% fÃ’c8s"],
            receive_evasion: ["ÃŸRÄ›Â¿^red"],
            receive_regen: ["tÂ£@M", "r<PÃ¦Â¦rs", "t#Ã†-wâ‚¬"],
            receive_spikes: ["[Â¶Ã¿=>drastic measure)%â€°", "awÃƒÂ¥"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["IÃœ4â€¡Ã¾Ã¸Ã¯aÃ¸know what must be done"],
            give_vulnerable: ["L I S T E   NbÅ ÃžÃaÃ¼1", "L I  S T E N   "],
            give_redirection: ["R E TU RN", "S  T O P"],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
  };
//RepairFriend
  env.COMBAT_ACTORS.surgeon_golem = {
        name: "Repairfoe",
        maxhp: 15,
        hp: 15,
        actions: ["mend", "tozik_attack", "foe_stab"],
        graphic: `
            <div class="sprite-wrapper surgeon-golem golemsprite" id="%SLUG-sprite-wrapper">
                <div class="sprite-overflow spritestack">
                    <img src="/img/sprites/combat/foes/surgeon.gif" id="%SLUG-golemsprite-base" class="sprite golemsprite-base">
                    
                    <div class="sprite golemsprite-head">
                        <img src="/img/sprites/combat/foes/surgeon-head.gif" id="%SLUG-golemsprite-head">
                    </div>
                    <img src="/img/sprites/combat/foes/surgeon-body.gif" id="%SLUG-golemsprite-body" class="sprite golemsprite-body">
                    <img src="/img/sprites/combat/foes/surgeon-arms.gif" id="%SLUG-golemsprite-arms" class="sprite golemsprite-arms">
                </div>

                <div class="target" entity="repairfriend"></div>
            </div>
        `,
        reactions: {
            receive_hit: ["1UiÃ«2Wâ€¡", "â€¡eÃŽKÃŸJÃ¤Ã¤", "/â€¦Â¿?Ã· Ã´LÃ£Ã˜", "CÂ©Ã‹", "0Eâ„¢NÃ³Â¨Ã½QÃ’", "â‚¬LWÃ©{Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "Â£~UÃ¾fÃ¢", "â€¦TÃº**"],
            receive_crit: ["themÂ±yâ„¢ÂÂ£Vâ€ ", "Ã±a3Ã™Ã¦mÃªÃ“ÂÂ§Â°ÃœÃ·ÃŸR", "ÂÃ·Â²ave rs i onÂ¬_.g?Ã§", ")Â§=XÂ«vÅ¡rpersÂ®Â¿Ã¦ÂshÃžÂ»"],
            receive_puncture: ["tHÂ¾ cÂ©râ€¹Ãœ", "hÃœÂ±ger", "%y0#Ãºu", "â‚¬^EÂ¿ythin8"],
            receive_destabilized: ["Ã‰â€¦VE  rÃ½Ã’;-nÃ‹", "t#8â€¡  thÄ›r", "Â©NÂ£ aÂ¤d mÃ†^Â¥", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã"],
            receive_fear: ["iÃ·Â¾(ÃÃ¹ a mÂ¯Â¯]..â€ r+Ã½Ã·^Ã¦nG", "zÃ›Â¾uc/I!", "TRÃ½Â¦NG"],
            receive_stun: ["Â¦(Ã›Âc\Â½â€°still time still  ti #*Ã«Â²`t hÃ†^â‚¬", " Â¤Â±Ã’Ã¿=WA ST ING %â€°Â¶Å¡ TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s^Ã‹Â£", "Â¤Ã‚Ã¦Â©ceded contr@Â¦", "cÃ˜ntrÂ©l"],
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
            receive_redirection: ["â€¡ogether ÃƒqIÃ¼Ã‘Â±Ãºâ‚¬Ã—Ã°Ã¿}?}Å“Ãˆ?ÂÂ±", "f/Nn@<Â¥ awÃƒÂ¦e", "c0aL*sâ‚¬Â£`"],
            receive_focus: ["}Ã­speaks clearlyÃ¿B  utÂ²Ã¥Ã¿Â±Ã¡", "t% fÃ’c8s"],
            receive_evasion: ["ÃŸRÄ›Â¿^red"],
            receive_regen: ["tÂ£@M", "r<PÃ¦Â¦rs", "t#Ã†-wâ‚¬"],
            receive_spikes: ["[Â¶Ã¿=>drastic measure)%â€°", "awÃƒÂ¥"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["IÃœ4â€¡Ã¾Ã¸Ã¯aÃ¸know what must be done"],
            give_vulnerable: ["L I S T E   NbÅ ÃžÃaÃ¼1", "L I  S T E N   "],
            give_redirection: ["R E TU RN", "S  T O P"],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
        }
    };
//Basic Golem (AOE specialist)
  env.COMBAT_ACTORS.basic_golem = {
    name: "Standard Golem",
    maxhp: 15,
    hp: 15,
    actions: ["special_self_destruct", "special_self_destruct", "berserk"],
    graphic: `
            <div class="sprite-wrapper golemsprite basic-golem" id="%SLUG-sprite-wrapper">
                <div class="sprite-overflow spritestack">
                    <img src="/img/sprites/combat/foes/golem.gif" id="%SLUG-golemsprite-base" class="sprite golemsprite-base">
                    
                    <div class="sprite golemsprite-head">
                        <img src="/img/sprites/combat/foes/golem-head.gif" id="%SLUG-golemsprite-head">
                    </div>
                    <img src="/img/sprites/combat/foes/golem-neck.gif" id="%SLUG-golemsprite-neck" class="sprite golemsprite-neck">
                    <img src="/img/sprites/combat/foes/golem-body.gif" id="%SLUG-golemsprite-body" class="sprite golemsprite-body">
                    <img src="/img/sprites/combat/foes/golem-leftarm.gif" id="%SLUG-golemsprite-leftarm" class="sprite golemsprite-leftarm">
                    <img src="/img/sprites/combat/foes/golem-rightarm.gif" id="%SLUG-golemsprite-rightarm" class="sprite golemsprite-rightarm">
                </div>

                <div class="target" entity="golem"></div>
            </div>
            `,
    reactions: {
            receive_hit: ["1UiÃ«2Wâ€¡", "â€¡eÃŽKÃŸJÃ¤Ã¤", "/â€¦Â¿?Ã· Ã´LÃ£Ã˜", "CÂ©Ã‹", "0Eâ„¢NÃ³Â¨Ã½QÃ’", "â‚¬LWÃ©{Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "Â£~UÃ¾fÃ¢", "â€¦TÃº**"],
            receive_crit: ["themÂ±yâ„¢ÂÂ£Vâ€ ", "Ã±a3Ã™Ã¦mÃªÃ“ÂÂ§Â°ÃœÃ·ÃŸR", "ÂÃ·Â²ave rs i onÂ¬_.g?Ã§", ")Â§=XÂ«vÅ¡rpersÂ®Â¿Ã¦ÂshÃžÂ»"],
            receive_puncture: ["tHÂ¾ cÂ©râ€¹Ãœ", "hÃœÂ±ger", "%y0#Ãºu", "â‚¬^EÂ¿ythin8"],
            receive_destabilized: ["Ã‰â€¦VE  rÃ½Ã’;-nÃ‹", "t#8â€¡  thÄ›r", "Â©NÂ£ aÂ¤d mÃ†^Â¥", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã"],
            receive_fear: ["iÃ·Â¾(ÃÃ¹ a mÂ¯Â¯]..â€ r+Ã½Ã·^Ã¦nG", "zÃ›Â¾uc/I!", "TRÃ½Â¦NG"],
            receive_stun: ["Â¦(Ã›Âc\Â½â€°still time still  ti #*Ã«Â²`t hÃ†^â‚¬", " Â¤Â±Ã’Ã¿=WA ST ING %â€°Â¶Å¡ TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s^Ã‹Â£", "Â¤Ã‚Ã¦Â©ceded contr@Â¦", "cÃ˜ntrÂ©l"],
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
            receive_redirection: ["â€¡ogether ÃƒqIÃ¼Ã‘Â±Ãºâ‚¬Ã—Ã°Ã¿}?}Å“Ãˆ?ÂÂ±", "f/Nn@<Â¥ awÃƒÂ¦e", "c0aL*sâ‚¬Â£`"],
            receive_focus: ["}Ã­speaks clearlyÃ¿B  utÂ²Ã¥Ã¿Â±Ã¡", "t% fÃ’c8s"],
            receive_evasion: ["ÃŸRÄ›Â¿^red"],
            receive_regen: ["tÂ£@M", "r<PÃ¦Â¦rs", "t#Ã†-wâ‚¬"],
            receive_spikes: ["[Â¶Ã¿=>drastic measure)%â€°", "awÃƒÂ¥"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["IÃœ4â€¡Ã¾Ã¸Ã¯aÃ¸know what must be done"],
            give_vulnerable: ["L I S T E   NbÅ ÃžÃaÃ¼1", "L I  S T E N   "],
            give_redirection: ["R E TU RN", "S  T O P"],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
    }
  };
  //Dullzika
  env.COMBAT_ACTORS.dull_keeper.reactions = {
            receive_hit: ["1UiÃ«2Wâ€¡", "â€¡eÃŽKÃŸJÃ¤Ã¤", "/â€¦Â¿?Ã· Ã´LÃ£Ã˜", "CÂ©Ã‹", "0Eâ„¢NÃ³Â¨Ã½QÃ’", "â‚¬LWÃ©{Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "Â£~UÃ¾fÃ¢", "â€¦TÃº**"],
            receive_crit: ["themÂ±yâ„¢ÂÂ£Vâ€ ", "Ã±a3Ã™Ã¦mÃªÃ“ÂÂ§Â°ÃœÃ·ÃŸR", "ÂÃ·Â²ave rs i onÂ¬_.g?Ã§", ")Â§=XÂ«vÅ¡rpersÂ®Â¿Ã¦ÂshÃžÂ»"],
            receive_puncture: ["tHÂ¾ cÂ©râ€¹Ãœ", "hÃœÂ±ger", "%y0#Ãºu", "â‚¬^EÂ¿ythin8"],
            receive_destabilized: ["Ã‰â€¦VE  rÃ½Ã’;-nÃ‹", "t#8â€¡  thÄ›r", "Â©NÂ£ aÂ¤d mÃ†^Â¥", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã"],
            receive_fear: ["iÃ·Â¾(ÃÃ¹ a mÂ¯Â¯]..â€ r+Ã½Ã·^Ã¦nG", "zÃ›Â¾uc/I!", "TRÃ½Â¦NG"],
            receive_stun: ["Â¦(Ã›Âc\Â½â€°still time still  ti #*Ã«Â²`t hÃ†^â‚¬", " Â¤Â±Ã’Ã¿=WA ST ING %â€°Â¶Å¡ TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s^Ã‹Â£", "Â¤Ã‚Ã¦Â©ceded contr@Â¦", "cÃ˜ntrÂ©l"],
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
            receive_redirection: ["â€¡ogether ÃƒqIÃ¼Ã‘Â±Ãºâ‚¬Ã—Ã°Ã¿}?}Å“Ãˆ?ÂÂ±", "f/Nn@<Â¥ awÃƒÂ¦e", "c0aL*sâ‚¬Â£`"],
            receive_focus: ["}Ã­speaks clearlyÃ¿B  utÂ²Ã¥Ã¿Â±Ã¡", "t% fÃ’c8s"],
            receive_evasion: ["ÃŸRÄ›Â¿^red"],
            receive_regen: ["tÂ£@M", "r<PÃ¦Â¦rs", "t#Ã†-wâ‚¬"],
            receive_spikes: ["[Â¶Ã¿=>drastic measure)%â€°", "awÃƒÂ¥"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["IÃœ4â€¡Ã¾Ã¸Ã¯aÃ¸know what must be done"],
            give_vulnerable: ["L I S T E   NbÅ ÃžÃaÃ¼1", "L I  S T E N   "],
            give_redirection: ["R E TU RN", "S  T O P"],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
  };
  env.COMBAT_ACTORS.dull_container.reactions = {
        name: "Warped Container",
        maxhp: 2,
        hp: 2,
        actions: ["primary"],
        graphic: `
            <div class="sprite-wrapper dulltainer" id="%SLUG-sprite-wrapper">
                <img class="sprite" src="/img/sprites/combat/foes/inc_dull.gif" id="%SLUG-sprite">
                <div class="target" entity="warped container"></div>
            </div>
            `,
        reactions: {
            catchall: ["1UiÃ«2Wâ€¡", "â€¡eÃŽKÃŸJÃ¤Ã¤", "/â€¦Â¿?Ã· Ã´LÃ£Ã˜", "CÂ©Ã‹", "0Eâ„¢NÃ³Â¨Ã½QÃ’", "â‚¬LWÃ©{Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "Â£~UÃ¾fÃ¢", "â€¦TÃº**"],
            dead: ["Â¿", "???"]
        },
        initialStatusEffects: [["ethereal", 1]],
    };
//DullFriend (foundation golem low mode)
  env.COMBAT_ACTORS.dull_golem = {
        name: "Dullfoe",
        maxhp: 35,
        hp: 35,
        actions: ["brawl", "windup"],
        windupActions: ["ik_attack", "dullflare", "focused_windup"],
        graphic: `
            <div class="sprite-wrapper golemsprite bossgolem" id="%SLUG-sprite-wrapper">
                <div class="sprite-overflow spritestack">
                    <img src="/img/sprites/combat/foes/golemboss.gif" id="%SLUG-golemsprite-base" class="sprite golemsprite-base">
                    
                    <div class="sprite golemsprite-head">
                        <img src="/img/sprites/combat/foes/golemboss-head.gif" id="%SLUG-golemsprite-head">
                    </div>
                    <img src="/img/sprites/combat/foes/golemboss-body.gif" id="%SLUG-golemsprite-body" class="sprite golemsprite-body">
                    <img src="/img/sprites/combat/foes/golemboss-arms.gif" id="%SLUG-golemsprite-body" class="sprite golemsprite-arms">
                </div>

                <div class="target" entity="foundation golem"></div>
            </div>
            `,
        reactions: {
            receive_hit: ["1UiÃ«2Wâ€¡", "â€¡eÃŽKÃŸJÃ¤Ã¤", "/â€¦Â¿?Ã· Ã´LÃ£Ã˜", "CÂ©Ã‹", "0Eâ„¢NÃ³Â¨Ã½QÃ’", "â‚¬LWÃ©{Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "Â£~UÃ¾fÃ¢", "â€¦TÃº**"],
            receive_crit: ["themÂ±yâ„¢ÂÂ£Vâ€ ", "Ã±a3Ã™Ã¦mÃªÃ“ÂÂ§Â°ÃœÃ·ÃŸR", "ÂÃ·Â²ave rs i onÂ¬_.g?Ã§", ")Â§=XÂ«vÅ¡rpersÂ®Â¿Ã¦ÂshÃžÂ»"],
            receive_puncture: ["tHÂ¾ cÂ©râ€¹Ãœ", "hÃœÂ±ger", "%y0#Ãºu", "â‚¬^EÂ¿ythin8"],
            receive_destabilized: ["Ã‰â€¦VE  rÃ½Ã’;-nÃ‹", "t#8â€¡  thÄ›r", "Â©NÂ£ aÂ¤d mÃ†^Â¥", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã"],
            receive_fear: ["iÃ·Â¾(ÃÃ¹ a mÂ¯Â¯]..â€ r+Ã½Ã·^Ã¦nG", "zÃ›Â¾uc/I!", "TRÃ½Â¦NG"],
            receive_stun: ["Â¦(Ã›Âc\Â½â€°still time still  ti #*Ã«Â²`t hÃ†^â‚¬", " Â¤Â±Ã’Ã¿=WA ST ING %â€°Â¶Å¡ TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s^Ã‹Â£", "Â¤Ã‚Ã¦Â©ceded contr@Â¦", "cÃ˜ntrÂ©l"],
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
            receive_redirection: ["â€¡ogether ÃƒqIÃ¼Ã‘Â±Ãºâ‚¬Ã—Ã°Ã¿}?}Å“Ãˆ?ÂÂ±", "f/Nn@<Â¥ awÃƒÂ¦e", "c0aL*sâ‚¬Â£`"],
            receive_focus: ["}Ã­speaks clearlyÃ¿B  utÂ²Ã¥Ã¿Â±Ã¡", "t% fÃ’c8s"],
            receive_evasion: ["ÃŸRÄ›Â¿^red"],
            receive_regen: ["tÂ£@M", "r<PÃ¦Â¦rs", "t#Ã†-wâ‚¬"],
            receive_spikes: ["[Â¶Ã¿=>drastic measure)%â€°", "awÃƒÂ¥"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["IÃœ4â€¡Ã¾Ã¸Ã¯aÃ¸know what must be done"],
            give_vulnerable: ["L I S T E   NbÅ ÃžÃaÃ¼1", "L I  S T E N   "],
            give_redirection: ["R E TU RN", "S  T O P"],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
        }
    };
//Foundation Golem
  env.COMBAT_ACTORS.boss_golem.reactions = {
            receive_hit: ["1UiÃ«2Wâ€¡", "â€¡eÃŽKÃŸJÃ¤Ã¤", "/â€¦Â¿?Ã· Ã´LÃ£Ã˜", "CÂ©Ã‹", "0Eâ„¢NÃ³Â¨Ã½QÃ’", "â‚¬LWÃ©{Ã°Ã", "Ã‡Ã¦Ã½Ã™â€¡ÃŸâ€ C", "Â£~UÃ¾fÃ¢", "â€¦TÃº**"],
            receive_crit: ["themÂ±yâ„¢ÂÂ£Vâ€ ", "Ã±a3Ã™Ã¦mÃªÃ“ÂÂ§Â°ÃœÃ·ÃŸR", "ÂÃ·Â²ave rs i onÂ¬_.g?Ã§", ")Â§=XÂ«vÅ¡rpersÂ®Â¿Ã¦ÂshÃžÂ»"],
            receive_puncture: ["tHÂ¾ cÂ©râ€¹Ãœ", "hÃœÂ±ger", "%y0#Ãºu", "â‚¬^EÂ¿ythin8"],
            receive_destabilized: ["Ã‰â€¦VE  rÃ½Ã’;-nÃ‹", "t#8â€¡  thÄ›r", "Â©NÂ£ aÂ¤d mÃ†^Â¥", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã"],
            receive_fear: ["iÃ·Â¾(ÃÃ¹ a mÂ¯Â¯]..â€ r+Ã½Ã·^Ã¦nG", "zÃ›Â¾uc/I!", "TRÃ½Â¦NG"],
            receive_stun: ["Â¦(Ã›Âc\Â½â€°still time still  ti #*Ã«Â²`t hÃ†^â‚¬", " Â¤Â±Ã’Ã¿=WA ST ING %â€°Â¶Å¡ TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s^Ã‹Â£", "Â¤Ã‚Ã¦Â©ceded contr@Â¦", "cÃ˜ntrÂ©l"],
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
            receive_redirection: ["â€¡ogether ÃƒqIÃ¼Ã‘Â±Ãºâ‚¬Ã—Ã°Ã¿}?}Å“Ãˆ?ÂÂ±", "f/Nn@<Â¥ awÃƒÂ¦e", "c0aL*sâ‚¬Â£`"],
            receive_focus: ["}Ã­speaks clearlyÃ¿B  utÂ²Ã¥Ã¿Â±Ã¡", "t% fÃ’c8s"],
            receive_evasion: ["ÃŸRÄ›Â¿^red"],
            receive_regen: ["tÂ£@M", "r<PÃ¦Â¦rs", "t#Ã†-wâ‚¬"],
            receive_spikes: ["[Â¶Ã¿=>drastic measure)%â€°", "awÃƒÂ¥"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["IÃœ4â€¡Ã¾Ã¸Ã¯aÃ¸know what must be done"],
            give_vulnerable: ["L I S T E   NbÅ ÃžÃaÃ¼1", "L I  S T E N   "],
            give_redirection: ["R E TU RN", "S  T O P"],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
  };
//Husk
  env.COMBAT_ACTORS.husk.reactions = {
            receive_hit: ["hu r ts", "t  he thpa in", "nO  ty  et  ", "ag  onÂ¥", "ag grâ€¡ ~â‚¬ve"],
            receive_crit: ["HU R TS", "T  HE THPA IN", "N0  TY  ET  ", "AG  ONâ€¡", "AG GRâ€¡ ~â‚¬VE"],
            receive_puncture: ["hÂ¿(â€°n g er", "e}vÂªer ytÃ­h&i ng", "%ÂÃ¿oÃ›Ã™", "n  o  non  o  n"],
            receive_destabilized: ["e ve  rÂ¥o ne", "t o  ge theÂ½", "on  e mÃ†  ny", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã", "dÃ†is co ne ct"],
            receive_fear: [" a m    â€ r Ã½  Ã¦nG", "zÃ›zÂ½  Ãºcr I", "TRÃ½  Â¦NG"],
            receive_stun: ["   still time still  ti m e  t her re", "    WA ST ING     TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s e e", "    ceded contr ol", "co  ntr+ol"],
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
            receive_focus: ["clear", "see", "t o  foc us"],
            receive_evasion: ["prÄ› pÃ„re `d"],
            receive_regen: [" a  te Ã…m", "f ixfi xit fi x", "t hÃ¦w e"],
            receive_spikes: ["a wa y"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["mus tbe  don e "],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "á¸§á»‚á¸ºáµ½ á¸¿á¸ á¸«eÈ½Æ¤ á¹ƒá»‡ Ä¦É†È½â±£ á¹‚á»†", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
  };
//Dozkallvi
  env.COMBAT_ACTORS.kivii = {
        name: "Dozkallvi",
        maxhp: 175,
        hp: 175,
        actions: ["speak", "stab", "husk_attack", "spy_target", "shell"],
        statusImmunities: ["stun"],
        graphic: `
            <div class="sprite-wrapper kivii" id="%SLUG-sprite-wrapper">
                <div class="sprite-overflow spritestack">
                    <img class="sprite" src="/img/sprites/combat/foes/kivii/combat.gif" id="%SLUG-sprite">
                    <div class="target" entity="dozkallvi"></div>
                </div>
            </div>
            `,
        reactions: {
            receive_hit: ["hu r ts", "t  he thpa in", "nO  ty  et  ", "ag  onÂ¥", "ag grâ€¡ ~â‚¬ve"],
            receive_crit: ["HU R TS", "T  HE THPA IN", "N0  TY  ET  ", "AG  ONâ€¡", "AG GRâ€¡ ~â‚¬VE"],
            receive_puncture: ["hÂ¿(â€°n g er", "e}vÂªer ytÃ­h&i ng", "%ÂÃ¿oÃ›Ã™", "n  o  non  o  n"],
            receive_destabilized: ["e ve  rÂ¥o ne", "t o  ge theÂ½", "on  e mÃ†  ny", "Ã¢ÂªÂ¥lÃ©Â§ÃŽÃ©Ã½Ã", "dÃ†is co ne ct"],
            receive_fear: [" a m    â€ r Ã½  Ã¦nG", "zÃ›zÂ½  Ãºcr I", "TRÃ½  Â¦NG"],
            receive_stun: ["   still time still  ti m e  t her re", "    WA ST ING     TI ME"],
            receive_vulnerable: ["Æ’Ã¸ÃŠ=Ã¨Â¶", "s e e", "    ceded contr ol", "co  ntr+ol"],
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
            receive_focus: ["clear", "see", "t o  foc us"],
            receive_evasion: ["prÄ› pÃ„re `d"],
            receive_regen: [" a  te Ã…m", "f ixfi xit fi x", "t hÃ¦w e"],
            receive_spikes: ["a wa y"],
            receive_surge: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lf Ã„SÂ¿De"],
            receive_empowered: ["mus tbe  don e "],
            give_fear: ["cÃ…4Ã„â€“sT Ã½ Ã¦Ã´r,Â§Â½Ã¿lfÃƒ Ã„SÂ¿De", "Ãâ±¤0 Ã˜ â±²Æž ", "Â§Â±Ã‚â±¤ á¹¾á¸®É²Gâ”€", "YÂºÅ® ÉƒÄ›C â€° á¹‚á»ƒ", "Å¡Ã¸á»« ÉŒâ‚¬cÉ‡ hÈ©á¸¸â”€lÆ¥ mÄ’ á¹¨Ã˜Â°á¹¹È‘Ä‰Å“", "á¸§á»‚á¸ºáµ½ á¸¿á¸ á¸«eÈ½Æ¤ á¹ƒá»‡ Ä¦É†È½â±£ á¹‚á»†", "â±¤EMÅ’M BEÉŒ", "CÄ¦Ã¸Â§á»†Æž", "á¸®â€¡'Å¡ á¹‚Ä’"]
        },
        initialStatusEffects: [["conjoined", 1]],
    };
//Dozkallvi Gauntlets
  env.COMBAT_ACTORS.kivii_gauntlet = {
    name: "Gauntlet",
    maxhp: 175,
    hp: 175,
    actions: ["windup", "kivii_grasp", "shell"],
    windupActions: ["archival_smash"],
    graphic: `
      <div class="sprite-wrapper kiviigauntlet" id="%SLUG-sprite-wrapper">
        <img class="sprite" src="/img/sprites/combat/foes/kivii/gauntlet.gif" id="%SLUG-sprite">
        <div class="target" entity="gauntlet"></div>
      </div>
    `,
    reactions: {},
    initialStatusEffects: [["conjoined", 1]],
  }
//Pain Shelf
  env.COMBAT_ACTORS.bstrdshelf = {
        name: "Pain Shelf",
        maxhp: 70,
        hp: 60,
        statusImmunities: ["stun"],
        actions: ["special_archiveshelf_annihilate", "special_archiveshelf_annihilate", "special_guard_all"],
        graphic: `
            <div class="sprite-wrapper bstrdshelf" id="%SLUG-sprite-wrapper">
                <img class="sprite" src="/img/sprites/combat/foes/archivalfoea.gif">
                <div class="target" entity="pain shelf"></div>
            </div>
            `,
        reactions: {
            receive_hit: ["...", "...weak...", "...not enough...", "...frail...", "...no..."],
            receive_crit: ["...won't stop...", "...can't stop...", "...can't back down...", "...cease..."],
            receive_puncture: ["...the pain...", "...hurts...", "...laceration..."],
            receive_destabilized: ["...awake...", "...volatile...", "...feel it...", "...it's time..."],
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
            receive_evasion: ["...outranged..."],
            receive_regen: ["...who?..."],
            receive_spikes: ["...payback..."],
            receive_surge: ["...a thousand limbs..."],
            receive_empowered: ["...strike..."],
            give_redirection: ["...fear...", "...me...", "...you...", "...don't forget...", "...charge...", "...won't back down..."],
        }
    };
//BSTRD Light (like lamp but better)
  env.COMBAT_ACTORS.bstrdlight = {
        name: "BSTRD Light",
        readoutActor: "bstrd",
        maxhp: 40,
        hp: 30,
        actions: ["spy", "mend", "special_mass_destabilize", "swipe", "rez"],
        graphic: `
            <div class="sprite-wrapper" id="%SLUG-sprite-wrapper">
                <div class="veilksprite bstrdlight">
                    <img class="sprite" src="/img/sprites/combat/foes/bstrdlampbase.gif" id="%SLUG-sprite">
                </div>
                <div class="target" entity="bstrdlight"></div>
            </div>
            `,
        reactions: {
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
            receive_buff: ["YOUR IN TROUBLE KOPER };-)", "NOW WERE COOKING!1", "TIME 2 GET EM ;}"],
            receive_rez: ["can't snuff me out ;-}}", "too EVIL to die!", "what did i miss ;-)", "lightened back UP!!", "AHAHA :^) GOT U", "AHAHA :^) WE BACK", "THE GOAT!"],
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
        },
        turnCheck: "lastRezzer"
  };
//BSTRD Boss
  env.COMBAT_ACTORS.bstrdboss = {
        name: "BSTRD Golem",
        readoutActor: "bstrd",
        maxhp: 50,
        hp: 50,
        lastStand: "bstrd",
        statusImmunities: ["stun"],
        actions: ["incoherent_gundown"],
        graphic: `
            <div class="sprite-wrapper archival-golem bstrd-golem golemsprite" id="%SLUG-sprite-wrapper">
                <div class="sprite-overflow spritestack">
                    <img src="/img/sprites/combat/foes/bstbody.gif" id="%SLUG-golemsprite-base" class="sprite golemsprite-base">
                    
                    <div class="sprite golemsprite-head">
                        <img src="/img/sprites/combat/foes/bsthead.gif" id="%SLUG-golemsprite-head">
                        <img src="/img/sprites/combat/foes/bstface.gif" id="%SLUG-golemsprite-face">
                    </div>
                    <img src="/img/sprites/combat/foes/bstbody.gif" id="%SLUG-golemsprite-body" class="sprite golemsprite-body">
                    <img src="/img/sprites/combat/foes/bstgun.gif" id="%SLUG-golemsprite-arms" class="sprite golemsprite-arms gunlower">
                    <img src="/img/sprites/combat/foes/bstgunraise.gif" id="%SLUG-golemsprite-arms" class="sprite golemsprite-arms gunraise">
                </div>

                <div class="target" entity="bstrd golem"></div>
            </div>
            `,
        reactions: {
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
            receive_buff: ["YOUR IN TROUBLE KOPER };-)", "TIME 2 GET EM ;}"],
            receive_rez: ["back to BUSYNESS!", "too EVIL to die!", "what did i miss ;-)", "DAT ALL YOU GOT?>??", "AHAHA :^) GOT U", "AHAHA :^) WE BACK", "THE GOAT!"],
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
        }
  };
  env.COMBAT_ACTORS.bstrdboss_lowintensity = {
        slug: "bstrdboss_lowintensity",
        name: "BSTRD Golem",
        readoutActor: "bstrd",
        maxhp: 50,
        hp: 50,
        statusImmunities: ["stun"],
        actions: ["special_fullauto", "special_fullauto", "special_guard_all"],
        graphic: `
            <div class="sprite-wrapper archival-golem bstrd-golem golemsprite" id="%SLUG-sprite-wrapper">
                <div class="sprite-overflow spritestack">
                    <img src="/img/sprites/combat/foes/bstbody.gif" id="%SLUG-golemsprite-base" class="sprite golemsprite-base">
                    
                    <div class="sprite golemsprite-head">
                        <img src="/img/sprites/combat/foes/bsthead.gif" id="%SLUG-golemsprite-head">
                        <img src="/img/sprites/combat/foes/bstface.gif" id="%SLUG-golemsprite-face">
                    </div>
                    <img src="/img/sprites/combat/foes/bstbody.gif" id="%SLUG-golemsprite-body" class="sprite golemsprite-body">
                    <img src="/img/sprites/combat/foes/bstgun.gif" id="%SLUG-golemsprite-arms" class="sprite golemsprite-arms gunlower">
                    <img src="/img/sprites/combat/foes/bstgunraise.gif" id="%SLUG-golemsprite-arms" class="sprite golemsprite-arms gunraise">
                    <img src="/img/sprites/combat/foes/bstgunblam.gif" id="%SLUG-golemsprite-arms" class="sprite golemsprite-arms gunblam">
                </div>

                <div class="target" entity="bstrd golem"></div>
            </div>
            `,
        reactions: {
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
            receive_buff: ["YOUR IN TROUBLE KOPER };-)", "TIME 2 GET EM ;}"],
            receive_rez: ["back to BUSYNESS!", "too EVIL to die!", "what did i miss ;-)", "DAT ALL YOU GOT?>??", "AHAHA :^) GOT U", "AHAHA :^) WE BACK", "THE GOAT!"],
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
        }
  };
//Akizet (no contractions or capitalisations for any obesk stuff)
  env.COMBAT_ACTORS.akizet.reactions = {
            eviscerate: ["This is a test to see if this works"],
            frenzy: ["dieâ€”", "die!", "ÂªÅ“pâ€”", "Ã§2ÂªÃ”!!", "Â¤Â¼Câ€”", "{Ã¾Ã¿Uâ€”", "&A^#3!!", "i will not stop!", "again!", "bleed!", "i will tear you apart!", "no more of you!"],//Unique to Akizet
            receive_hit: ["@#Ã†$J", "Ff#$"],//these seem to only play when attacked by pain shelf lol
            receive_crit: ["ÃŸÃƒÃ†M!!", "AH!"],
            receive_puncture: ["i have felt worse", "a familiar feeling", "you will regret that", "i will not fall", "funfriend!", "i am used to it"],
            receive_destabilized: ["every cell... awake...", "velzie's glee", "it is kill or be killed", "i can work with this", "a high risk maneuver"],
            receive_fear: ["no, no...", "velzie forgive me", "velzie please", "it cannot be!", "STOP STOP STOP", "i know I KNOW I KNOW", "NO MORE NO MORE",
                          ()=>env.combat.has('husk') ? "the eyes..." : "so many gone...",
                          ()=>env.rpg.is2D ? "you promised! you said..." : "youÃ®Å¸~FÂ£ÃŸpÃ›Â¿)"],
            receive_stun: ["Ahg!", "Ã‡Ã¦Ã™â€¡ÃŸâ€ !", "st-!"],
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
            miss: ["Å“Â¦ÃªA", "i was wrong!", "rushed", "no!", "i got careless"],
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
            receive_hit: ["@#Ã†$J", "Ff#$"],
            receive_crit: ["ÃŸÃƒÃ†M!!", "Ã†!!"],
            receive_puncture: ["i am... bleeding...?", "ow!! what...", "my cloak!", "it cut me!", "it is fine, i did not need that", "oh, great"],
            receive_destabilized: ["may velzie look away", "is my body supposed to do that?", "just need to not get hit", "all or nothing", "velzie is cackling"],
            receive_fear: ["stop looking at me!!", "get away from me!", "no, no no no", "what did it say??", "it is fine! this is fine! i am fine!", "i am not going back!", "you cannot!"],
            receive_stun: ["Ahg!", "Ã‡Ã¦Ã™â€¡ÃŸâ€ !", "st-!"],
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
            stun: ["where did my eyes go?!", "just give me a blink", "can we time out?", "..."],
            regen: ["feeling better", "feeling good", "more of that please", "keep it rolling", "beats larval medicine for sure"],
            crit: ["clean...", "it is simply that easy", "a few more like that...", "that was lucky", "thank me later", "but of course!", "all skill", "doubted me?", "fall apart"],
            miss: ["â‚¬Ã–Ã¤!", "oh...", "it is too fast!!", "too bad", "just stay still!", "i cannot grasp it!", "it is not so simple"],
            crit_buff: ["so that goes there...", "thank me later", "you know what to do"],
            receive_buff: ["thanks", "thank you", "alright!"],
            receive_rez: ["you are gonna have to try a little harder", "let us make velzie rage", "my savior", "miss me?", "what did i miss?", "we should avoid that next time"],
            receive_carapace: ["so heavy", "you cannot hurt me now!"],
            receive_repairs: ["healing applicators?", "thanks", "i owe you", "you are the best"],
            receive_redirection: ["finally some space", "just keep them away", "they will not stand a chance", "are you sure?",
                                () => env.rpg?.lastAction?.user?.slug ? `${env.rpg?.lastAction?.user?.name?.toLowerCase()}??` : "really??"],
            receive_focus: ["iii see youuu", "i have my core upon you", "waiit for it...", "just you wait..."],
            receive_evasion: ["speed of a bulb", "just try and catch me", "i can dodge anything"],
            receive_regen: ["just what i needed", "very nice", "now i can get hit again", "many thanks"],
            receive_spikes: ["cannot touch this", "HEY! OVER HERE!", "velzie must be a fan"],
            receive_surge: ["double the gakvu", "hell yeah"],
            receive_empowered: ["heh", "my turn now", "charged up", "groundsmindry plus"],
            give_vulnerable: ["feeling weak?", "i will not let you go", "you are in my grasp now", "feeling watched?", "avoid THIS"],
            give_redirection: ["what would you do without me?"],
            give_fear: ["i will melt you!", "your corru is my plaything"]
  };
//Tozik
  env.COMBAT_ACTORS.tozik.reactions = {
            receive_hit: ["Ah!"],
            receive_crit: ["Ã†!!"],
            receive_puncture: ["ÃŽK^ÃŸJ!", "i can... just seal it...", "I am going to need a blink", "aÃƒgh!", "cover me", ""],
            receive_destabilized: ["i hear it calling", "this is against safety protocols", "...what?", "...who?", "uUugh", ""],
            receive_fear: ["that cannot be", "s-stop...", "and yet it moves", "stop...", "",
                  ()=> env.rpg.is2D ? "there is nothing here" : "hollowed out...",
                  ()=> env.rpg.is2D ? "where are you?" : "what happened to you?"],
            receive_stun: ["Ã‡Ã¦Ã™â€¡ÃŸâ€ !", "Ahg!", "st-!", ""],
            receive_vulnerable: ["i am their target", "it sees me", "they are coming for me", "it is upon me", "it watches me", "i am exposed", ""],
            receive_weakened: ["i feel... nauseous", "the corruskivi!", "my tools are compromised", "they damaged my tools", ""],
            receive_open_wound: ["this hurts... bad...", "this will take longer to fix", "my glass is... fractured...", ""],
            receive_rot: ["this is infectious!", "it is eating at me!", "this will take longer to fix", "it burns!", ""],
            dead: ["no n-", "they-", "i ne-", "sto-", "sorry", ""],
            evade: ["close...", "woah", "not this time", "too close", "fortunate", "no", ""],
            puncture: ["i need to fix this", "hurts...", "losing form", "i just need to self repair", ""],
            destabilized: ["my form is unstable", "feels... fuzzy?", "head spinning...", "i need to not get hit", ""],
            stun: ["where...", "i cannot move...", "where are you?", "where are they?", "..."],
            regen: ["regenerating", "feeling better", "passive healing", "very good", ""],
            crit: ["here you go", "offensive repairs", "fuel at capacity", "",
                  ()=>env.combat.has('husk') || env.rpg.is2D ? "good enough" : "hehe"],
            miss: ["miscalculated", "no...", "damn...", "sorry", "my mistake", ""],
            crit_buff: ["keep going", "use this", "you will need this"],
            receive_buff: ["i will put it to use", "appreciated", ""],
            receive_rez: ["let us finish this", "it is not my time", "i cannot die while they need me", "back to work", "i have work to do"],
            receive_carapace: ["thank you", "a strong applicator", ""],
            receive_repairs: ["that is better", "thank you", "a buffer", ""],
            receive_redirection: ["i will return the favor", "together, then", ""],
            receive_focus: ["i am prepared", "i see their weak points", "hold on", ""],
            receive_evasion: ["in position", "i see them", "they will not hit me", ""],
            receive_regen: ["starting repairs", ""],
            receive_spikes: ["this formation...", ""],
            receive_surge: ["for me?", ""],
            receive_empowered: ["corruskivi reformated", ""],
            give_vulnerable: ["you are weak", ""],
            give_redirection: ["i will handle this", ""],
            give_fear: ["i will bleed you out", ""]
  };
  env.COMBAT_ACTORS.tozik_npc.reactions = {
            receive_hit: ["Ah!"],
            receive_crit: ["Ã†!!"],
            receive_puncture: ["ÃŽK^ÃŸJ!", "i can... just seal it...", "I am going to need a blink", "aÃƒgh!", "cover me", ""],
            receive_destabilized: ["i hear it calling", "this is against safety protocols", "...what?", "...who?", "uUugh", ""],
            receive_fear: ["that cannot be", "s-stop...", "and yet it moves", "stop...", "",
                  ()=> env.rpg.is2D ? "there is nothing here" : "hollowed out...",
                  ()=> env.rpg.is2D ? "where are you?" : "what happened to you?"],
            receive_stun: ["Ã‡Ã¦Ã™â€¡ÃŸâ€ !", "Ahg!", "st-!", ""],
            receive_vulnerable: ["i am their target", "it sees me", "they are coming for me", "it is upon me", "it watches me", "i am exposed", ""],
            receive_weakened: ["i feel... nauseous", "the corruskivi!", "my tools are compromised", "they damaged my tools", ""],
            receive_open_wound: ["this hurts... bad...", "this will take longer to fix", "my glass is... fractured...", ""],
            receive_rot: ["this is infectious!", "it is eating at me!", "this will take longer to fix", "it burns!", ""],
            dead: ["no n-", "they-", "i ne-", "sto-", "sorry", ""],
            evade: ["close...", "woah", "not this time", "too close", "fortunate", "no", ""],
            puncture: ["i need to fix this", "hurts...", "losing form", "i just need to self repair", ""],
            destabilized: ["my form is unstable", "feels... fuzzy?", "head spinning...", "i need to not get hit", ""],
            stun: ["where...", "i cannot move...", "where are you?", "where are they?", "..."],
            regen: ["regenerating", "feeling better", "passive healing", "very good", ""],
            crit: ["here you go", "offensive repairs", "fuel at capacity", "",
                  ()=>env.combat.has('husk') || env.rpg.is2D ? "good enough" : "hehe"],
            miss: ["miscalculated", "no...", "damn...", "sorry", "my mistake", ""],
            crit_buff: ["keep going", "use this", "you will need this"],
            receive_buff: ["i will put it to use", "appreciated", ""],
            receive_rez: ["let us finish this", "it is not my time", "i cannot die while they need me", "back to work", "i have work to do"],
            receive_carapace: ["thank you", "a strong applicator", ""],
            receive_repairs: ["that is better", "thank you", "a buffer", ""],
            receive_redirection: ["i will return the favor", "together, then", ""],
            receive_focus: ["i am prepared", "i see their weak points", "hold on", ""],
            receive_evasion: ["in position", "i see them", "they will not hit me", ""],
            receive_regen: ["starting repairs", ""],
            receive_spikes: ["this formation...", ""],
            receive_surge: ["for me?", ""],
            receive_empowered: ["corruskivi reformated", ""],
            give_vulnerable: ["you are weak", ""],
            give_redirection: ["i will handle this", ""],
            give_fear: ["i will bleed you out", ""]
  };
//Miltza
  env.COMBAT_ACTORS.miltza.reactions = {
            receive_hit: ["Ah!"],
            receive_crit: ["Ã†Ã¶Ã¶!!"],
            receive_puncture: ["restorative, quick!", "bleeding!", "help me!", "help me out!"],
            receive_destabilized: ["die DIE!! DIE!! DIE!!!", "i feel sick", "my systems are compromised!", "you will SUFFER!!", "aAAAaah!"],
            receive_fear: ["stop...", "velzie take me from here", "stay away! away!!", "no no no!!",
                      ()=> env.rpg.is2D ? "this is not us! it is NOT!" : "it is not that! it is NOT!",
                      ()=> env.rpg.is2D ? "this cannot be real" : "that one looks like...!"],
            receive_stun: ["Ahg!", "Ã‡Ã¦Ã™â€¡ÃŸâ€ !", "st-!"],
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
            regen: ["feeling better!", "alright!", "thank the jut", "PLEASE keep this going"],
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
            receive_regen: ["ah, thank you!", "just what i needed", "PLEASE keep applying this"],
            receive_spikes: ["this is weird...", "hopefully it will not be necesary"],
            receive_surge: ["it is like i have six arms!", "ready to act!"],
            receive_empowered: ["this strength!", "my turn now!"],
            give_vulnerable: ["i see it!", "you should aim for that", "you can hit it there and there", "keeping an eye on them", "scanning them...", "i got you!", "i have you!"],
            give_redirection: ["i am not sure about this!"],
            give_fear: ["velzie will not be kind to you"]
  };
//Bozko
  env.COMBAT_ACTORS.bozko.reactions = {
            receive_hit: ["@#Ã†$J", "Ff#$"],
            receive_crit: ["Ã†!!", "you!"],
            receive_puncture: ["how?", "it pierced my glass", "no...", "i am bleeding?",
                  ()=>env.combat.has('cavik') ? "cavik!" : "it punched through...",
                  ()=>env.combat.has('tozik') ? "tozik!" : "stop the bleeding"],
            receive_destabilized: ["i hear them again...", "this will work in my favor", "what...?", "...to crush them", "i am not deterred"],
            receive_fear: ["no...", "stay back!", "you do not scare me!", "STAY BACK!",
                      ()=> env.rpg.is2D ? "so many lost" : "is it really you...?"],
            receive_stun: ["Ahg!", "Ã‡Ã¦Ã™â€¡ÃŸâ€ !", "st-!"],
            receive_vulnerable: ["try me", "i will not give way", "do it", "i can take it"],
            receive_weakened: ["i can still defend", "this will not stop me"],
            receive_open_wound: ["how...?", "i will not give in", "my body...", "i cannot back down"],
            receive_rot: ["what is this?", "something is eating at me"],
            dead: ["ug-", "no...", "i failed...", "i canno-"],
            evade: ["no", "not so easy", "i am not slow", "my turn", "your last mistake"],
            puncture: ["blood everywhere", "i need patching", "need support!", "not this again..."],
            destabilized: ["unstable...", "stop this...", "i cannot defend like this"],
            stun: ["what--", "just you wait", "what is happening", "..."],
            regen: ["keep it coming", "very good", "going to need more"],
            crit: ["get away from them", "smashed to pieces", "die", "you are dead"],
            miss: ["ÃŸÃÆ’", "my fault", "you!"],
            crit_buff: ["take this", "you need this", "here"],
            receive_buff: ["keep it up", "good"],
            receive_rez: ["i have to get back up", "you cannot strike me down", "i cannot stay down", "they still need me"],
            receive_carapace: ["i am strong", "even tougher now", "better than chitin", "you cannot hurt me", "never show fear"],
            receive_repairs: ["this is useful, thanks", "i will make use of these", "keep adding layers"],
            receive_redirection: ["i will not stay behind", "we will do this together"],
            receive_focus: ["i am ready", "i am prepared", "i will not miss"],
            receive_evasion: ["they will not touch me", "i will not falter"],
            receive_regen: ["thank you", "alright", "a breather"],
            receive_spikes: ["come on", "strike me now...", "there is nothing they can do"],
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
            receive_puncture: ["oh no...", "dammit!", "@#Ã†$J", "they hit me!"],
            receive_destabilized: ["it hurts", "hurts", "i feel you", "pleas e", "they are everywhere"],
            receive_fear: ["akizet!!", "keep it away from me!", "h--help me!", "no, no no no", "stay back! stay back!",
                      ()=> env.rpg.is2D ? "speak no more! please!" : "i... i remember you..."],
            receive_stun: ["Ahg!", "Ã‡Ã¦Ã™â€¡ÃŸâ€ !", "st-!"],
            receive_vulnerable: ["it is looking at me!", "stop it!", "help!", "help me!", "they are coming for me!"],
            receive_weakened: ["i feel sick", "my bombs!", "i do not feel good", "my bombs are dulled!"],
            receive_open_wound: ["i need help!", "i am badly hurt!", "i-i am exposed!"],
            receive_rot: ["th-this is!", "get this off me!", "it is eating at my body!"],
            dead: ["ak-!", "sto-!", "Aa-!"],
            evade: ["oh!!", "what?!"],
            puncture: ["i need to seal this!", "s-should be a simple fix...", "i am bleeding!"],
            destabilized: ["someone is there", "i cannot wake up", "who are you?", "you have to end this"],
            stun: ["whhaahh"],
            regen: ["coming together again!", "regenerating!", "healing wounds!"],
            crit: ["i got you!", "catch!", "boom!", "right where it hurts!", "yes!"],
            miss: ["ah!", "no!", "missed!!"],
            crit_buff: ["this should help!", "have this!"],
            receive_buff: ["thank you!"],
            receive_rez: ["what happened?!", "i am back..?"],
            receive_carapace: ["what is this made of?"],
            receive_repairs: ["thank you!", "shields up!", "protection!"],
            receive_redirection: ["be careful!", "i will cover you!",
                                () => env.rpg?.lastAction?.user?.slug ? `stay close ${env.rpg?.lastAction?.user?.name?.toLowerCase()}!` : "stay close!"],
            receive_focus: ["i know what to do", "i can do this", "i know where to strike"],
            receive_evasion: ["you will not catch me", "i am as ready as can be"],
            receive_regen: ["together!", "already feeling better!"],
            receive_spikes: ["spiky!", "spikes are up!"],
            receive_surge: ["stand back!", "get ready!" "doubling the bombs!"],
            receive_empowered: ["watch this!", "a bigger boom!"],
            give_vulnerable: ["do you see those spots?", "their shell is vulnerable", "you can hit them there!"],
            give_redirection: ["thank you!!", "i will cover you!", "i-i will protect you!", "i got this!"],
            give_fear: ["your time to detonate"]
  };
//Itzil-Karik Golem
   env.COMBAT_ACTORS.ikgolem.reactions = {
            receive_hit: ["@#Ã†$J", "Ff#$"],
            receive_crit: ["how--?!"],
            receive_puncture: ["the chassis!!", "they pierced the armor!"],
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
            miss: ["Ã·Â°Ã²!!", "lucky you", "next time"],
            crit_buff: ["i hope that helps!"],
            receive_buff: ["excellent"],
            receive_rez: ["ah, it works again!", "back at it!", "it is gonna take more than that!", "functional again!"],
            receive_carapace: ["more armor! yes!", "untouchable!"],
            receive_repairs: [()=> env.rpg.is2D ? "we will put it to use" : "thank you, thank you"],
            receive_redirection: ["what?", "unnecessary, but thanks"],
            receive_focus: [()=> env.rpg.is2D ? "soon..." : "i know where to strike"],
            receive_evasion: ["it is not all about speed", "big AND nimble"],
            receive_regen: [()=> env.rpg.is2D ? "going to need more" : "appreciated!"],
            receive_spikes: [()=> env.rpg.is2D ? "come at us!" : "come at me!"],
            receive_surge: [()=> env.rpg.is2D ? "they will DIE" : "they will be dust"],
            receive_empowered: ["even stronger still",
                          ()=> env.rpg.is2D ? "we will CRUSH them" : "i will crush them"],
            receive_windup: [()=> env.rpg.is2D ? "charging!" : "charging..."],
            give_vulnerable: ["you know what to do"],
            give_redirection: ["i got you!", "i got this", "protecting!"],
            give_fear: ["DIE!!"]
  };
//
//Rooms
//
  env.stageEntities['6'] = {
    contains: {
        id: "foe",
        class: "evil newevil staysdead s-evil",
        type: "g_s1",
        dialogue: "genericenemy",
        html: env.COMBAT_ACTORS['basic_golem'].graphic
    }
  };
  env.stageEntities['@'] = {
    contains: {
      id: "foe",
      class: "evil newevil staysdead o-evil",
      type: "g_o2",
      dialogue: "genericenemy",
      html: env.COMBAT_ACTORS['archival_golem'].graphic
    }
  };
env.stageEntities['9'] = {
    contains: {
        id: "foe",
        class: "evil newevil staysdead o-evil",
        type: "g_o1",
        dialogue: "genericenemy",
        html: env.COMBAT_ACTORS['dull_container'].graphic
    }
};
  env.stages.g_o_r_dull = {
    locale: "golem",
    creature: env.stageEntities.embassyCreature,
    exec: function () {
        env.stages.golemStageInit(this);
    },
    entities: {
        "%": {
            class: "locked",
            teleportTarget: "test",
            lockFlag: "permalocked"
        },

        "H": {
            class: "door slim right",
            teleportTarget: "g_o_hall1",
            teleportSpot: 22,
            shouldFace: "right",
            contains: {
                html: `<span class='sign' definition="INHERITED CONTEXT::'minor operations'"></span>`,
                dyp: {
                    class: "doorsign",
                    style: "--signImage: url(/img/local/embassy/sign_MO.gif);"
                }
            } 
        },

        "D": {
            class: "door slim up",
            teleportTarget: "g_o_r_friends",
            contains: {
                html: `<span class='sign' definition="INHERITED CONTEXT::'friends';'echo research'"></span>`,
                dyp: {
                    class: "doorsign",
                    style: "--signImage: url(/img/local/embassy/sign_ER.gif);"
                }
            } 
        },

        "â˜º": {
            class: "prop blocks notile gelitable",
            contains: {
                class: "dullbeam",
                html: "<figure><span></span><span></span><span></span><span></span><span><div class='target' entity='dull structure'></div></span></figure>"
            }
        },

        "Ãœ": {
            class: "prop blocks notile",
            contains: {
                dyp: {
                    image: 'url(/img/local/embassy/terminal_busted.gif)',
                    width: 1,
                    height: 3,
                    transform: 'translateY(-25%)',
                }
            }
        },

    },
    width: 11,
    plan: `
        ...........
        .....â—‹.....
        ....â—‹â—‹â—‹....
        ...â—‹â—‹â—‹â—‹â—‹...
        ..â—‹â—‹.Ãœ.â—‹â—‹..
        .â—‹â—‹â—‹.â˜º.â—‹â—‹pH
        ..â—‹â—‹.Ãœ.9â—‹..
        ...â—‹â—‹â—‹â—‹â—‹...
        ....â—‹â—‹â—‹....
        .....â—‹.....
        .....D.....
    `,

    html: `
        <canvas class="golemceiling dullrug" sprite="/img/textures/black.gif, /img/local/embassy/dullrug.gif" fit="stretch, auto" repeat="repeat, no-repeat" position="center" baseWidth="[wallW]" baseHeight="[wallH]"></canvas>
        <canvas class="golemceiling dullrug" sprite="/img/textures/black.gif, /img/local/embassy/dullrug.gif" fit="stretch, auto" repeat="repeat, no-repeat" position="center" baseWidth="[wallW]" baseHeight="[wallH]"></canvas>
    `
};
//IK Golem Making room
env.stageEntities['3'] = {
    contains: {
        id: "foe",
        class: "evil newevil staysdead m-evil",
        type: "g_m1",
        dialogue: "genericenemy",
        html: env.COMBAT_ACTORS['critta_bishop'].graphic
    }
};
env.stageEntities['4'] = {
    contains: {
        id: "foe",
        class: "evil newevil staysdead m-evil",
        type: "g_m2",
        dialogue: "genericenemy",
        html: env.COMBAT_ACTORS['bstrdlight'].graphic
    }
};
env.stageEntities['5'] = {
    contains: {
        id: "foe",
        class: "evil newevil staysdead m-evil",
        type: "g_m3",
        dialogue: "genericenemy",
        html: env.COMBAT_ACTORS['critta_rook'].graphic
    }
};
env.stages['g_m_major'] = {
    locale: "golem",
    creature: env.stageEntities.embassyCreature,
    exec: function () {
        env.stages.golemStageInit(this)

        if(!check("PAGE!!majvatsnote") && check("PAGE!!mboss")) {
            startDialogue("m_maj")
            change("PAGE!!majvatsnote", true)
        }

        change("PAGE!!majvats", true)
    },
    entities: {
        "^": {
            class: "door slim down",
            teleportTarget: "g_m_hall",
            teleportSpot: 52,
            shouldFace: "left",
            contains: {
                html: `<span class='sign' definition="INHERITED CONTEXT::'manufacturing'"></span>`,
                dyp: {
                    class: "doorsign",
                    style: "--signImage: url(/img/local/embassy/sign_M.gif);"
                }
            } 
        },

        "â˜»": {
            class: "prop blocks notile",
            contains: {
                examineEntity: "greater terminal",
                class: "ikterminal",
                dyp: {
                    image: 'url(/img/local/embassy/projectorbig.gif)',
                    width: 3,
                    height: 3,
                    transform: 'rotateY(180deg) translateZ(calc(var(--gridTileSize) * 1.51)) translateY(10%)',
                }
            }
        },

        "â†“": {
            class: "prop blocks notile",
            contains: {
                dyp: {
                    image: 'url(/img/local/embassy/projectorscreen.gif)',
                    width: 1.5,
                    height: 1.5,
                    transform: 'translateX(-33.5%) rotateY(90deg) translateY(-50%) translateX(33.3%)',
                }
            }
        },

        "â—™": {
            class: "prop blocks notile",
            contains: {
                dyp: {
                    image: 'url(/img/local/embassy/projectorscreen.gif)',
                    width: 1.5,
                    height: 1.5,
                    transform: 'translateX(33.5%) rotateY(90deg) translateY(-50%) translateX(33.3%)',
                }
            }
        },

        "â˜º": {
            class: "blocks notile"
        },

        "â™¦": {
            class: "blocks notile",
            contains: {
                dyp: {
                    image: 'transparent',
                    width: 3,
                    height: 3,
                    class: "majorvatwall",
                    transform: 'rotateY(180deg) translateZ(calc(var(--gridTileSize) * 0.5))',
                }
            }
        },

        "â˜¼": {
            class: "blocks notile",
            contains: {
                dyp: {
                    image: 'transparent',
                    width: 4.3,
                    height: 3,
                    class: "majorvatwall",
                    transform: 'translateZ(calc(var(--gridTileSize) * -1)) rotateY(-135deg)',
                }
            }
        },

        "â™«": {
            class: "blocks notile",
            contains: {
                dyp: {
                    image: 'transparent',
                    width: 4.3,
                    height: 3,
                    class: "majorvatwall",
                    transform: 'translateZ(calc(var(--gridTileSize) * -1)) rotateY(135deg)',
                }
            }
        },

        "â™£": {
            class: "blocks notile",
            contains: {
                dyp: {
                    image: 'transparent',
                    width: 2,
                    height: 3,
                    class: "majorvatwall",
                    transform: 'translateX(-25%) rotateY(-90deg) translateX(25%)',
                }
            }
        },

        "â™ ": {
            class: "blocks notile",
            contains: {
                dyp: {
                    image: 'transparent',
                    width: 2,
                    height: 3,
                    class: "majorvatwall",
                    transform: 'translateX(25%) rotateY(90deg) translateX(-25%)',
                }
            }
        },

        'O': { 
            class: "prop blocks notile",
            contains: {
                class: "golemparts",
                html: `<figure>
                    <img src="/img/local/embassy/ikgolemhead.gif" class="ikh">
                    <img src="/img/local/embassy/ikgolembody.gif" class="ikb">
                    <img src="/img/local/embassy/ikgolemarm.gif" class="ika">
                    <img src="/img/local/embassy/ikgolemarm.gif" class="ika">
                </figure>`
            }
        },

        'á¹†': { 
            class:"blocks cwall north cornerwall",
            contains: {
                html: `
                    <canvas class="wall"></canvas>
                    <canvas class="wall" sprite="/img/textures/panelpatterntranshort.gif, /img/textures/fadein.gif, /img/local/embassy/wallcover.gif" position="bottom, top" repeat="repeat-x" fit="stretch-y, auto, stretch" baseWidth="[wallW]" baseHeight="3"></canvas>
                `
            }
        },

    },
    width: 11,
    //a central vat (square tech) with some doodads around it, storage
    //would be cool if there was a terminal and the golem parts could be moved into the vats
    plan: `
        á¹†...â”°^â”°....
        .â€¼bâ–‘â–‘pâ–‘bbâ€¼.
        ..â€¼â–‘â–‘4â–‘b...
        .â˜ºâ™«â€¼â–‘â–‘â–‘â€¼â˜¼â˜º.
        .â˜ºâ˜ºâ™ â–‘5â–‘â™£â˜ºâ˜º.
        .â˜ºâ˜ºâ—™â–‘â–‘â–‘â†“â˜ºâ˜º.
        .â˜ºâ˜ºâ˜ºâ˜ºâ™¦â˜ºâ˜ºâ˜ºâ˜º.
        .....â˜»O....
    `,

    html: `
    <canvas class="golemceiling majordome" sprite="/img/local/embassy/golemceiling.gif, /img/local/embassy/ceilingcover.gif" fit="auto, stretch" repeat="repeat" baseWidth="9" baseHeight="3"></canvas>
    <canvas class="golemceiling majorcolumn" sprite="/img/local/embassy/golemceiling.gif, /img/local/embassy/ceilingcover.gif" fit="auto, stretch" repeat="repeat-y" baseWidth="3" baseHeight="5"></canvas>
    `
};
//Upgrade Room
env.stageEntities['Ï¡'] = {
    contains: {
        id: "foe",
        class: "evil newevil staysdead o-evil",
        type: "NEW_EEVIL_SPAWN",
        dialogue: "genericenemy",
        html: env.COMBAT_ACTORS['critta_knight'].graphic
    }
};
env.stages['g_m_minor'] = {
    locale: "golem",
    creature: env.stageEntities.embassyCreature,
    exec: function () {
        env.stages.golemStageInit(this)
        if(!check("PAGE!!minvats")) startDialogue("m_min")
    },
    entities: {
        "^": {
            class: "door slim down",
            teleportTarget: "g_m_hall",
            teleportSpot: 34,
            shouldFace: "left",
            contains: {
                html: `<span class='sign' definition="INHERITED CONTEXT::'manufacturing'"></span>`,
                dyp: {
                    class: "doorsign",
                    style: "--signImage: url(/img/local/embassy/sign_M.gif);"
                }
            } 
        },

        "â˜º": {
            class: "placeholder blocks"
        },

        "Ãœ": {
            class: "prop blocks",
            contains: {
                examineEntity: "lesser terminal",
                dyp: {
                    image: 'url(/img/local/embassy/terminal_online.gif)',
                    width: 1,
                    height: 3,
                    transform: 'translateY(-25%)',
                }
            }
        },

        "â•¢": {
            class: "prop blocks notile",
            contains: {
                dyp: {
                    image: 'url(/img/local/embassy/vat.gif)',
                    width: 1,
                    height: 3,
                    transform: 'translateY(-25%)',
                    cross: true
                }
            }
        },

        "â”": {
            class: "prop blocks notile",
            contains: {
                dyp: {
                    image: 'url(/img/local/embassy/vatbroke.gif)',
                    width: 1,
                    height: 3,
                    transform: 'translateY(-25%)',
                    cross: true
                }
            }
        },

        'á¹†': { 
            class:"blocks cwall north cornerwall",
            contains: {
                html: `
                    <canvas class="wall" sprite="/img/local/embassy/vatwall.gif, /img/textures/panelpatterntranshort.gif, /img/textures/fadein.gif, /img/local/embassy/wallcover.gif" position="center, bottom, top" repeat="repeat-x" fit="stretch, stretch-y, auto, stretch" baseWidth="[wallH]" baseHeight="3"></canvas>
                    <canvas class="wall" sprite="/img/local/embassy/vatwall.gif, /img/textures/panelpatterntranshort.gif, /img/textures/fadein.gif, /img/local/embassy/wallcover.gif" position="center, bottom, top" repeat="repeat-x" fit="stretch, stretch-y, auto, stretch" baseWidth="[wallW]" baseHeight="3"></canvas>
                `
            }
        },

        'á¹ ': { 
            class:"blocks cwall south cornerwall",
            contains: {
                html: `
                    <canvas class="wall" sprite="/img/local/embassy/vatwall.gif, /img/textures/panelpatterntranshort.gif, /img/textures/fadein.gif, /img/local/embassy/wallcover.gif" position="center, bottom, top" repeat="repeat-x" fit="stretch, stretch-y, auto, stretch" baseWidth="[wallH]" baseHeight="3"></canvas>
                    <canvas class="wall" sprite="/img/local/embassy/vatwall.gif, /img/textures/panelpatterntranshort.gif, /img/textures/fadein.gif, /img/local/embassy/wallcover.gif" position="center, bottom, top" repeat="repeat-x" fit="stretch, stretch-y, auto, stretch" baseWidth="[wallW]" baseHeight="3"></canvas>
                `
            }
        },
    },
    width: 9,
    //a minor vats (square tech) with a central control, some storage
    plan: `
        á¹†..â”°^â”°...
        .bâ–‘â–‘pâ–‘â–‘b.
        .â–‘â–‘â–‘â–‘â–‘â–‘b.
        .â–‘â–‘â–‘â–‘â–‘Ï¡â–‘.
        .â–‘.â•¢Ãœâ•¢.â–‘.
        .â•¢â”.â•¢.â•¢â”.
        ........á¹ 
    `,

    html: `
        <canvas class="golemceiling" sprite="/img/textures/black.gif" fit="stretch" baseWidth="[wallW]" baseHeight="[wallH]"></canvas>
    `
};
//
//Enemy Encounters
//CH 1
  env.COMBAT_FORMATIONS.tutorial_golem = {
    enemies: ["container", "veilklight", "basic_golem", "basic_golem", "veilklight", "container"],
    rewards: ['restorative']
  };
//Recreation
  env.COMBAT_FORMATIONS.recreation_containers_1 = {//Closest to entrance
    enemies: ["container", "veilklight", "pressure_golem", "surgeon_golem", "veilklight"],
    rewards: ['aima_cyst']
  };
  env.COMBAT_FORMATIONS.recreation_containers_2 = {//On the side
    enemies: ["attendant", "veilklight", "basic_golem", "archival_golem", "attendant"]
  };
  env.COMBAT_FORMATIONS.recreation_containers_3 = {//One in the back
    enemies: ["container", "basic_golem", "veilklight", "surgeon_golem", "attendant"]
  };
//Personnel
  env.COMBAT_FORMATIONS.attendant_squad_1 = {//2nd position
    enemies: ["attendant", "bstrdlight", "pressure_golem", "bstrdlight", "attendant"],
    rewards: ['kavruka']
  };
  env.COMBAT_FORMATIONS.attendant_squad_3 = {//Closest
    enemies: ["container", "attendant", "archival_golem", "archival_golem", "attendant", "container"]
  };
  env.COMBAT_FORMATIONS.kazki_room_containers = {//Kazki Room ambush
    enemies: ["container", "container", "container", "container", "container", "container"],
    rewards: ['restorative']
  };
  env.COMBAT_FORMATIONS.movefriend = {//Final Boss
    enemies: ["tendrils", "tendrils", "tendrils", "enemy_movefriend", "tendrils", "tendrils", "tendrils"],
    class: "movefight"
  };
  env.COMBAT_FORMATIONS.movefriend_lowintensity = {
    enemies: ["tendrils", "tendrils", "tendrils", "enemy_movefriend_lowintensity", "tendrils", "tendrils", "tendrils"]
  };
//Evil mode
  env.COMBAT_FORMATIONS.archivetutorial = {
    enemies: ["bstrdlight", "pressure_golem", "archival_golem", "maintcloak"],
    rewards: ['satik_cyst'],
    class: "bastard",
    advanceRate: 1000,
    bgmRate: 0.75,
    getBgm: ()=> {return env.embassy.music_bstrdcombat}
  };
  env.COMBAT_FORMATIONS.archivecommon = {//Main, left
    enemies: ["bstrdlight", "bstrdlight", "archival_golem", "husk", "attendant"],
    rewards: ['aima_cyst'],
    class: "bastard",
    advanceRate: 1000,
    bgmRate: 0.75,
    getBgm: ()=> {return env.embassy.music_bstrdcombat}
  };
  env.COMBAT_FORMATIONS.archivecloaktainer = {//Main right
    enemies: ["surgeon_golem", "attendant", "husk", "attendant", "maintcloak"],
    class: "bastard",
    advanceRate: 1000,
    bgmRate: 0.75,
    getBgm: ()=> {return env.embassy.music_bstrdcombat}
  };
  env.COMBAT_FORMATIONS.archivedouble = {//Left room
    enemies: ["bstrdlight", "maintcloak", "archival_golem", "archival_golem", "container"],
    rewards: ['kavruka'],
    class: "bastard",
    advanceRate: 1000,
    bgmRate: 0.75,
    getBgm: ()=> {return env.embassy.music_bstrdcombat}
  };
  env.COMBAT_FORMATIONS.archivecontainers = {//Right room
    enemies: ["bstrdlight", "attendant", "container", "container", "container", "container", "container"],
    rewards: ['satik_cyst'],
    class: "bastard",
    advanceRate: 1000,
    bgmRate: 0.75,
    getBgm: ()=> {return env.embassy.music_bstrdcombat}
  };
  env.COMBAT_FORMATIONS.archiveshelfminiboss = {//Pain Shelf
    enemies: ["bstrdlight", "bstrdshelf", "maintcloak"],
    class: "bastard bstrdshelf",
    advanceRate: 1000,
    bgmRate: 0.75,
    getBgm: ()=> {return env.embassy.music_bstrdcombat}
  };
  env.COMBAT_FORMATIONS.bstrdboss = {//BSTRD Boss
    enemies: ["bstrdlight", "bstrdboss", "bstrdboss_lowintensity", "maintcloak"],
    rewards: ['restorative'],
    advanceRate: 1000,
    bgmRate: 0.75,
    getBgm: ()=> {return env.embassy.music_bstrdcombat}
  };
  env.COMBAT_FORMATIONS.bstrdboss_lowintensity = {
    enemies: ["bstrdlight", "bstrdboss_lowintensity", "husk", "maintcloak"],
    rewards: ['restorative'],
    advanceRate: 1000,
    bgmRate: 0.75,
    getBgm: ()=> {return env.embassy.music_bstrdcombat}
  };
//Golem Maintenance
  env.COMBAT_FORMATIONS.g_prelobby1 = {//Personnel
    enemies: ["bstrdlight", "husk", "husk", "husk"],
    rewards: ['disabler'],
    advanceRate: 1000
  };
  env.COMBAT_FORMATIONS.g_prelobby2 = {
    enemies: ["constructor_golem", "surgeon_golem", "pressure_golem", "basic_golem", "husk"],
    advanceRate: 1000
  };
//Lobby
  env.COMBAT_FORMATIONS.g_prelobby3 = {
    enemies: ["bstrdlight", "surgeon_golem", "pressure_golem", "maintcloak"],
   advanceRate: 1000
  };
//Minor Operations
  env.COMBAT_FORMATIONS.g_o1 = {//Dull Analysis
    enemies: ["dull_container", "dull_container", "dull_container", "dull_container", "dull_container", "dull_container", "dull_container", "dull_container", "dull_container", "dull_container", "dull_container", "dull_container"],
    advanceRate: 1000,
    class: "containerspam",
    getBgm: ()=> {return env.embassy.music_golems_combat},
    bgmRate: 0.75
  };
  env.COMBAT_FORMATIONS.g_o2 = {//Echo Research
        enemies: ["surgeon_golem", "constructor_golem", "archival_golem", "archival_golem", "archival_golem"],
        advanceRate: 1000
    };
  env.COMBAT_FORMATIONS.g_oboss = {//Translation
        enemies: ["maintcloak", "translation_golem", "maintcloak"],
        rewards: ['restorative', 'drill'],
        advanceRate: 1000,
        class: "translatorzone"
    };
//Dullzika Branch
  env.COMBAT_FORMATIONS.g_s1 = {//Sfer Supply
        enemies: ["basic_golem", "basic_golem", "basic_golem", "basic_golem", "basic_golem"],
        advanceRate: 1000
    };
  env.COMBAT_FORMATIONS.g_s2 = {//Sfer Generation
        enemies: ["constructor_golem", "pressure_golem", "archival_golem", "basic_golem", "maintcloak"],
        advanceRate: 1000
    };
  env.COMBAT_FORMATIONS.g_sboss = {//Sfer Storage
        enemies: ["bstrdlight","dull_keeper", "pressure_golem"],
        rewards: ['restorative', 'rot'],
        advanceRate: 1000,
        class: "containerspam",
        getBgm: ()=> {return env.embassy.music_golems_combat},
        bgmRate: 0.75
    };
//Kivii Branch
  env.COMBAT_FORMATIONS.g_m1 = {//Manufacturing
    enemies: ["bstrdlight", "critta_bishop", "critta_pawn", "critta_pawn"],
    class: "bastard",
    advanceRate: 1000
  };
  env.COMBAT_FORMATIONS.g_m2 = {//Lesser Vats
    enemies: ["bstrdlight", "critta_queen", "critta_king", "critta_pawn"],
    class: "bastard",
    advanceRate: 1000
  };
  env.COMBAT_FORMATIONS.g_m3 = {//UNUSED??? Lesser Vats 2
    enemies: ["critta_bishop", "critta_pawn", "critta_knight", "critta_rook"],
    class: "bastard",
    advanceRate: 1000
  };
  env.COMBAT_FORMATIONS.NEW_EEVIL_SPAWN = {//Main Vats 2
    enemies: ["critta_queen", "husk", "attendant", "critta_knight"],
    class: "bastard",
    advanceRate: 1000
  };
  env.COMBAT_FORMATIONS.g_mboss = {//Distribution
        enemies: ["kivii_gauntlet", "kivii_gauntlet", "kivii", "kivii_gauntlet", "kivii_gauntlet"],
        rewards: ['restorative', 'empower'],
        class: "kivii",
        advanceRate: 1000,
        bgmRate: 0.85
  };
//FinalBoss
   env.COMBAT_FORMATIONS.g_boss = {//Advanced Operations
        enemies: ["surgeon_golem", "boss_golem", "dull_golem", "maintcloak"],
        rewards: ['restorative'],
        advanceRate: 1000,
        class: "bossgolem",
        bgmVol: 0.65,
        getBgm: ()=>{return env.embassy.music_golems_boss}
  };
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

//Encounter
env.embassy.startKazkiRoomAmbush = ()=>{
    env.combat.lastEngaged = "kazki_room_containers"
    startCombat(env.COMBAT_FORMATIONS['kazki_room_containers'].enemies, page.party, {
        bgm: env.embassy.music_combat, 
        bgmRate: 1,
        endCallback: (loser)=> {
            if(loser.name != "ally") startDialogue('d3r2_postcombat'); else env.combat.lossState()
        }
    });
};





}});
