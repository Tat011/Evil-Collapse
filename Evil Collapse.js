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
//Izpel Deapplicators (item_antistatus)
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
    addStatus({target: subject, origin, status: "weakened", length: 2, dontDrawIconLine: true});
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
//Vecrivi
  env.STATUS_EFFECTS.item_siphon.events.onCreated = function({statusObj}) {
    if(statusObj.slug == "item_siphon" && !this.status.initialized) {
      this.status.initialized = true
      this.status.affecting.vecriviCount = 1
    }
  };
//Parii Spike
//  env.STATUS_EFFECTS.item_pariispike.events.onCreated = function({statusObj}) {
//item_antibarrier

//item_shell


//item_surge

//item_hope

//item_translator

//
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
        help: "+2T:DESTABILIZE +1:SPIKES +3T:CARAPACE",
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
                spikes: {name: 'spikes', length: 1 },
                carapace: {name: 'carapace', length: 3},
            }
        }, 
        exec: function(user, target) {
            play('destabilize', 0.5);
            addStatus({target: user, status: "destabilized", length: 2, noReact: true}); 
            addStatus({target: user, status: "spikes", length: 1, noReact: true}); 
            addStatus({target: user, status: "carapace", length: 3, noReact: true}); 
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
        name: 'megastatus',
      },
      hitStatus: this.stats.status.vulnerable,
      critStatus: this.stats.status.critical_flaw,
    });
  };
//Pain Shelf Moves
  env.ACTIONS.archiveshelf_withstand.details = {
            flavor: "'strike a braced target'",
            onHit: `'[STAT::amt] [STATUS::rot] [STATUS::puncture]'`,
            onCrit: `'additional [STATUS::rot] [STATUS::puncture]'`,
            conditional: `<em><o-col>USER::</o-col></em>'next options will be defensive'`,
        };
  env.ACTIONS.archiveshelf_withstand.stats = {
    accuracy: 1,
    crit: 0.25,
    amt: 1,
    status: {
      rot: {
        name: 'rot',
        length: 1
      },
      puncture: {
        name: 'puncture',
        length: 2
      }
    }
  };
  env.ACTIONS.archiveshelf_withstand.exec = function(user, target, beingUsedAsync, {actionMessageIndex} = {}) {
            user.currentChoiceSet = "defensive"
            return env.GENERIC_ACTIONS.singleTarget({
                action: this, 
                user, 
                target,
                genExec: ()=> {
                    addStatus({target: target, origin: user, status: "rot", length: 1})
                    addStatus({target: target, origin: user, status: "puncture", length: 2})
                },
                critExec: ()=> {
                    addStatus({target: target, origin: user, status: "rot", length: 1})
                    addStatus({target: target, origin: user, status: "puncture", length: 2})
                },
            })
  };

  env.ACTIONS.archiveshelf_risky.details = {
            flavor: "'overreach in attempt to strike dodging target'",
            onHit: `'[STAT::amt]'`,
            onCrit: `'[STATUS::stun] [STATUS::rot] [STATUS::puncture]'`,
            conditional: `<em><o-col>USER::</o-col></em>'[STATUS::vulnerable]';'next options will be sweeping attacks'`,
        };
  env.ACTIONS.archiveshelf_risky.stats = {
    accuracy: 0.6,
    crit: 200,
    amt: 2,
    status: {
      vulnerable: {
        name: 'vulnerable',
        length: 1
      },
      puncture: {
        name: 'puncture',
        length: 2
      },
      rot: {
        name: 'rot',
        length: 1
      },
      stun: {
        name: 'stun',
        length: 1
      }
    }
  };
  env.ACTIONS.archiveshelf_risky.exec = function(user, target, beingUsedAsync, {actionMessageIndex} = {}) {
    user.currentChoiceSet = "offensive"
    return env.GENERIC_ACTIONS.singleTarget({
      action: this, 
      user, 
      target,
      hitSfx: {
        name: 'stab',
        rate: 1
      },
      genExec: ()=> {
        addStatus({target: user, origin: user, status: "vulnerable", length: 1})
      },
      critExec: ()=> {
        addStatus({target: target, origin: user, status: "stun", length: 1})
        addStatus({target: target, origin: user, status: "rot", length: 1})
        addStatus({target: target, origin: user, status: "puncture", length: 2})
      }
    })
  };

  env.ACTIONS.archiveshelf_sweep.stats.details = {
            flavor: "'strike entire opposing team with many limbs'",
            onUse: `'HIT all targets twice'`,
            onHit: `'[STAT::amt] [STATUS::vulnerable]'`,
            onCrit: `'[STATUS::critical_flaw]'`,
            conditional: `<em><o-col>USER::</o-col></em>'next options will be direct strikes'`,
  };
  env.ACTIONS.archiveshelf_sweep.stats = {
    accuracy: 0.8,
    crit: 0.33,
    amt: 2,
    status: {
      vulnerable: {name: "vulnerable", length: 3},
      critical_flaw: {name: "critical_flaw", length: 3}
    }
  };
//Movefoe
  env.ACTIONS.special_movefoe_tumble.details = {
            flavor: "'utilize volatile deconstruction tool'", // todo
            onUse: `'HIT all foes'`,
            onHit: `'[STAT::amt] [STATUS::vulnerable]'`,
            onCrit: `'[STATUS::critical_flaw]'`
        };
  env.ACTIONS.special_movefoe_tumble.stats = {
    accuracy: 0.8,
    crit: 0.33,
    amt: 1,
    status: {
      vulnerable: {name: "vulnerable", length: 3},
      critical_flaw: {name: "critical_flaw", length: 3}
    }
  };
  env.ACTIONS.special_movefoe_tumble.exec = function(user, target, beingUsedAsync) {
            let action = this
            env.rpg.classList.add("movetumble")
            env.GENERIC_ACTIONS.teamWave({
                team: user.enemyTeam,
                extraDelay: 1000,
                exec: (actor, i) => {                    
                    for (let j = 0; j < 2; j++) {
                        setTimeout(() => {
                            let hit = env.GENERIC_ACTIONS.singleTarget({
                                action: action, 
                                user, 
                                target: actor,
                                hitStatus: {name: 'vulnerable',length: 3},
                                critStatus: {name: 'critical_flaw',length: 3},
                                critExec: ({target}) => {
                                    target.box.classList.add('movetumble')
                                    setTimeout(() => target.box.classList.remove('movetumble'), 1000)
                                }
                            })

                            if(hit) env.rpg.effectMessage.action({
                                user,
                                target: actor,
                                hit,
                                reason: "tumble",
                                action: `%TARGET is tossed around!`,
                                specialHitText: hit == "crit" ? "%TARGET is thrown off balance!" : "%TARGET suffers an impact!",
                            })

                        }, j * env.ADVANCE_RATE * 0.25)                                           
                    }
                },
                endCallback: ()=> setTimeout(()=>env.rpg.classList.remove("movetumble"), 5000),
                advanceAfterExec: true, beingUsedAsync, user,
            })
        };
        
  env.ACTIONS.special_movefoe_collide.details.onCrit = `'[STATUS::stun] [STATUS::weakened]';'only stuns one target per turn'`
  env.ACTIONS.special_movefoe_collide.stats = {
            accuracy: 0.8,
            crit: 0.5,
            amt: 2,
            status: {
                stun: {name: "stun", length: 1},
                weakened: {name: "weakened", length: 3}
            }
  };
  env.ACTIONS.special_movefoe_collide.exec = function(user, target, beingUsedAsync) {
            let action = this
            env.rpg.classList.add("movecollide")

            let hasStunned = false
            env.GENERIC_ACTIONS.teamWave({
                team: user.enemyTeam,
                extraDelay: 1000,
                exec: (actor, i) => {
                    let hit = env.GENERIC_ACTIONS.singleTarget({
                        action: action, 
                        user, 
                        target: actor,
                        critSfx: {
                            name: 'crit',
                            rate: 0.75
                        },
                        critExec: ({target}) => {
                            console.log("target found", target)
                            playCombatCrit() // for whatever reason this doesn't happen
                            target.box.classList.add('movecollide')
                            setTimeout(() => target.box.classList.remove('movecollide'), 1000)
                        }
                    })
                    //only stuns one person in a wave unless it's crittamode
                    if(hit == "crit" && (!hasStunned || page.party.crittamode)) {
                        addStatus({target: actor, origin: user, status: "stun", length: 1, dontDrawIconLine: true})
                        addStatus({target: actor, origin: user, status: "weakened", length: 3, dontDrawIconLine: true})

                        drawEffectLine(user.box, actor.box, {
                            color: "obesk",
                            effectClass: "baseline icon thick mega",
                            duration: 5000,
                            style: `--icon: url(/img/sprites/combat/statuses/stun.gif);`
                        })
                        hasStunned = true
                    }
                    if(hit) {
                        env.rpg.effectMessage.action({
                            user,
                            target: actor,
                            hit,
                            isMinor: true,
                            reason: "collide",
                            action: "%TARGET stumbles from the collision!",
                            specialHitText: hit == "crit" ? `%TARGET smashes into the wall${hasStunned ? '' : ' really hard'}!!` : `%TARGET suffers an impact!` 
                        })
                    }
                },
                endCallback: () => setTimeout(() => env.rpg.classList.remove("movecollide"), 3500),
                advanceAfterExec: true, beingUsedAsync, user,
            })
        };

  env.ACTIONS.special_movefoe_pry.exec = function(user, target) {
            play('dull', 0.8, 1)
            let summon = "movefoe_tendrils"
            if(page.party.crittamode) summon = "movefoe_tendrils_frame"
            midCombatActorAdd(user.team, summon, 'left')
            midCombatActorAdd(user.team, summon, 'left')
            midCombatActorAdd(user.team, summon, 'right')
            midCombatActorAdd(user.team, summon, 'right')
            user.usedPry = true
            setTimeout(()=>advanceTurn(user), env.ADVANCE_RATE + 1000)
        }
//PHASE 2
  env.ACTIONS.incoherent_movefriend.exec = function(user, target) {
            env.rpg.effectMessage.action({
                user,
                target,
                hit: "crit",
                action: !env.rpg.mfUsesLeft ? "THE WALLS TWIST AROUND THE WHOLE TEAM" : "THE WALLS SHIFT AROUND %TARGET"
            })

            if(!env.rpg.mfUsesLeft) {
                env.rpg.effectMessage.action({
                    user,
                    target: user,
                    hit: "crit",
                    isMinor: true,
                    reason: "last stand",
                    action: "%USER is losing control..."
                })
            }

            if(!user.usedPry) {
                midCombatActorAdd(env.rpg.enemyTeam, 'movefoe_tendrils', 'left')
                midCombatActorAdd(env.rpg.enemyTeam, 'movefoe_tendrils', 'right')
                env.rpg.settings.turnCallback()

                user.usedPry = true

                env.rpg.effectMessage.action({
                    user,
                    target: user,
                    hit: true,
                    isMinor: true,
                    reason: "pry",
                    action: "%USER DRAWS TENDRILS FROM THE WALLS"
                })
            }

            let lastStand = !env.rpg.mfUsesLeft
            if(lastStand) {
                user.hp = 0 // force last stand state
                updateStats({actor: user})
            }

            //vortex on screen, circle expands into fullscreen bg (animation in CSS)
            env.rpg.insertAdjacentHTML('beforeend', `
                <div class="golem-vortex bh-action-${user.slug} bh-action"></div>
                <div id="${user.slug}-bh" class="bh-action-${user.slug} bh-action">
                    <div class="bh_damage-wrapper"></div>
                </div>
            `);
            env.rpg.vortex = document.querySelector(`.golem-vortex.bh-action-${user.slug}`)
            env.rpg.actionZone = document.querySelector(`#${user.slug}-bh`)

            //animate the vortex
            setTimeout(()=>{
                env.rpg.vortex.classList.add('active');

                //we should set this up so that on last stand, it randomly targets the whole (living) team
                //additionally, it should end early on full death
                bh_start({
                    playerEl: `<div id="bh_player" class="notice" style="background-image:url(${target.portraitUrl})"></div>`, 
                    onHit: () => {
                        var hit
                        if(lastStand) {
                            let possibleTargets = env.rpg.allyTeam.members.filter(member => member.hp > 0)
    
                            if(possibleTargets.length == 0) env.bulletHell.complete()
                            hit = combatHit(possibleTargets[rand(0, possibleTargets.length)], {amt: 1, acc: 3, crit: 0, origin: user});
                            if(hit) play('hit', 1.5, 0.5); else play("miss", 1.25, 0.5)
                            
                        } else if(target.state != "dead") {
                            hit = combatHit(target, {amt: 3, acc: 7.5, crit: 0, origin: user}); // results in about 66% acc when faced with evasion
                            if(hit) play('hit', 1.5, 0.5); else play("miss", 1.25, 0.5)
                            if(target.hp == 0) env.bulletHell.complete()
                        } else {
                            env.bulletHell.complete()
                        }
    
                        if(hit == false) return "dodged"; else return "damaged"
                    }
                })

                //animation done, activate ze game
                setTimeout(()=>{
                    body.classList.add('in-golem-vortex')
                    env.rpg.actionZone.classList.add('active')
                    document.querySelector(`#bh_player`).classList.add('active')

                    //change moves based on uses left
                    switch(env.rpg.mfUsesLeft) {
                        case 5: startDialogue("d3_movespecial"); user.tutorial = true; break // tutorial
                        case 4: bh_movefriend({level: "healthy2"}); break // easy
                        case 3: bh_movefriend({level: "tutorial"}); break // med
                        case 2: bh_movefriend({level: "advanced1"}); break // hard
                        case 1: bh_movefriend({level: "advanced3"}); break // hard
                        default: case 0: bh_movefriend({level: "lastStand", duration: 70000}); break // last
                    }

                    env.rpg.mfUsesLeft--;
                    env.rpg.effectMessage.close()
                }, 500);

                setTimeout(()=>{
                    env.rpg.classList.add('cull');
                }, 1500);
            }, env.ADVANCE_RATE * 0.5)
        }
//Hallucination attack (Psychosis)
  env.ACTIONS.hallucination_attack.details = {
    flavor: `'wound through intent alone';'leaves target vulnerable'`,
    onHit: `'[STAT::amt]'`,
    onCrit: `'[STATUS::vulnerable]'`
  };
  env.ACTIONS.hallucination_attack.stats = {
    accuracy: 1,
    crit: 0.2,
    amt: 1,
    status: {
      vulnerable: {name:"vulnerable", length: 2},
    }
  };
  env.ACTIONS.hallucination_attack.exec = function(user, target) {
    return env.GENERIC_ACTIONS.singleTarget({
      action: this, 
      user, 
      target,
      hitSfx: { name: "talkfeed", volume: 0.75, rate: 0.75, },
      critExec: ()=> {
        addStatus({target: target, origin: user, status: "vulnerable", length: 2})
      }
    })
  };
//
//Enemies
//Evader Container
  env.COMBAT_ACTORS.container_evader.actions = ["container_evader"];
  env.COMBAT_ACTORS.container_evader.maxhp = [10];
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
//Spy Container
  env.COMBAT_ACTORS.container_spy.actions = ["spy", "daze_lastresort"];
//Sfer Container
  env.COMBAT_ACTORS.container_sfer.maxhp = [10];
  env.COMBAT_ACTORS.container_sfer.hp = [10];
  env.COMBAT_ACTORS.container_sfer.actions = ["container_sfer"];
//Listener
  env.COMBAT_ACTORS.listener.maxhp = [100];
  env.COMBAT_ACTORS.listener.hp = [100];
//VeilkLight
//Attendant
  env.COMBAT_ACTORS.personnel_attendant.maxhp = [30];
  env.COMBAT_ACTORS.personnel_attendant.hp = [30];
//Archival Golem
//Wounded Archival Golem
  env.COMBAT_ACTORS.wounded_archival_golem.actions = ["archival_smash", "special_guard_all", "special_guard_all", "special_guard_all", "special_guard_all", "special_guard_all", "special_guard_all", "special_guard_all"];
//Basic Golem
  env.COMBAT_ACTORS.basic_golem.name = ["Standard Golem"];
  env.COMBAT_ACTORS.basic_golem.maxhp = [30];
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
//Repairfriend 2
  env.COMBAT_ACTORS.repairfriend.name = ["Repairfoe"];
//Hallucination
  env.COMBAT_ACTORS.hallucination.maxhp = [8];
  env.COMBAT_ACTORS.hallucination.hp = [6];
//Constructor
  env.STATUS_EFFECTS.story_constructor.stunImmunityMod = [3];
//Vat
  env.STATUS_EFFECTS.story_constructorvat.stunImmunityMod = [3];
  env.COMBAT_ACTORS.constructor_vat.maxhp = [50];
  env.COMBAT_ACTORS.constructor_vat.hp = [50];
//Dozkallvi
  env.COMBAT_ACTORS.kivii.maxhp = [350];
  env.COMBAT_ACTORS.kivii.hp = [350];
//Foundation Golem 1
  env.COMBAT_ACTORS.foundation_golem.actions = ["windup_jab", "windup_jab", "kivskin_shell", "special_guard_all"];
  env.COMBAT_ACTORS.foundation_golem.windupActions = ["ik_attack", "dullflare", "kivskin_malfunction"];
//Foundation Golem 2
//Husk
//Dozkallvi
//Painshelf
  env.COMBAT_ACTORS.bstrdshelf.maxhp = [150];
  env.COMBAT_ACTORS.bstrdshelf.hp = [150];
  env.COMBAT_ACTORS.bstrdshelf.actions = ["special_archiveshelf_annihilate", "special_archiveshelf_annihilate", "husk_attack_rot", "husk_declaration"];
//
//Allies
//Akizet (no contractions or capitalisations for any obesk stuff)
  env.COMBAT_ACTORS.akizet.maxhp = [14];
  env.COMBAT_ACTORS.akizet.hp = [14];
//The Gakk
//Tozik
//Miltza
  env.COMBAT_ACTORS.miltza.initialStatusEffects = [["terror", 1]];
//Bozko
//Cavik
  env.COMBAT_ACTORS.cavik.maxhp = [8];
  env.COMBAT_ACTORS.cavik.hp = [8];
//Itzil-Karik Golem
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
//Evil Mode
//Evil Mode tutorial
  env.COMBAT_FORMATIONS.archive_intro.enemies = ["bstrdlight", "maintcloak", "container_evader", "archival_golem", "kivskin"];
//Main
  env.COMBAT_FORMATIONS.archivecommon.enemies = ["bstrdlight", "husk_support", "maintcloak", "personnel_attendant", "husk_guard"];
  env.COMBAT_FORMATIONS.archivecloaktainer.enemies = ["bstrdlight", "surgeon_golem", "husk_observer", "maintcloak", "husk_striker"];
//Left
  env.COMBAT_FORMATIONS.archivedouble.enemies = ["bstrdlight", "bstrdlight", "maintcloak", "archival_golem", "archival_golem"];
//Right
  env.COMBAT_FORMATIONS.archivecontainers.enemies = ["listener", "bstrdlight", "maintcloak", "container_sfer", "container_sfer", "container_exploder", "container_exploder"];
//Bosses
  env.COMBAT_FORMATIONS.archiveshelfminiboss.enemies = ["bstrdlight", "bstrdshelf", "maintcloak"];
  env.COMBAT_FORMATIONS.bstrdboss.enemies = ["bstrdlight", "bstrdboss", "bstrdboss_lowintensity", "maintcloak"];
//Golem Maintenance
//Golem Personnel
  env.COMBAT_FORMATIONS.golem_husks_1.enemies = ["husk_support", "husk_observer", "husk_striker", "husk_guard"];
//Lobby
  env.COMBAT_FORMATIONS.golem_husks_2.enemies = ["surgeon_golem", "husk_observer", "basic_golem", "basic_golem", "husk_guard"];
//Dullzica side
  env.COMBAT_FORMATIONS.golem_husks_interlude.enemies = ["husk_support", "maintcloak", "husk_striker", "kivskin", "kivskin"];
//Dullzica
  env.COMBAT_FORMATIONS.golem_husks_3.enemies = ["husk_support", "husk_observer", "dull_keeper", "husk_striker", "husk_guard"];
  env.COMBAT_FORMATIONS.golem_husks_3.startCallback = ()=>{
            env.rpg.fakeDullzikaSprite = env.rpg.querySelector("#fakespritewrapper")
            env.rpg.enemyTeam.members.forEach(m=>{ 
                m.hp = 17
                addStatus({target: m, status: "story_dullzika"})
            })
        };
//Dozkallvi side (no changes)
//Dozkallvi
  env.COMBAT_FORMATIONS.golem_kivii.enemies = ["kivii_gauntlet", "kivii_gauntlet", "kivii", "kivii_gauntlet", "kivii_gauntlet"];
//Translation Core side
  env.COMBAT_FORMATIONS.golem_repair.enemies = ["repairfriend", "repairfriend", "repairfriend", "wounded_archival_golem"];
//Translation Core (no changes)
//Foundation Golem
  env.COMBAT_FORMATIONS.golem_boss.enemies = ["bstrdlight", "foundation_golem", "maintcloak"];
  env.COMBAT_FORMATIONS.golem_boss_final.enemies = ["bstrdlight", "boss_golem", "bstrdlight"];
  }});
