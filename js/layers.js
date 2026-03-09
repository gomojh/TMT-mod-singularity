function getPenaltyBase() {
    let pb = hasUpgrade("f", 12) ? 0.5 : 0.1;
    if (player.ha && player.ha.unlocked && getBuyableAmount("ha", 13).gt(0)) {
        pb += buyableEffect("ha", 13).toNumber();
    }
    return Math.min(1, pb);
}
addLayer("e", {
    name: "essence", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "🔮", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() {
        return {
            unlocked: true,
            points: new Decimal(0)
        }
    },
    color: "#4287f5",
    requires() {
        let req = new Decimal(10)
        if (hasUpgrade("e", 22)) req = new Decimal(5)
        return req
    }, // Can be a function that takes requirement increases into account
    resource: "basic essence", // Name of prestige currency
    baseResource: "mana", // Name of resource prestige is based on
    baseAmount() { return player.points }, // Get the current amount of baseResource
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0.5, // Prestige currency exponent
    gainMult() { // Calculate the multiplier for main currency from bonuses
        let mult = new Decimal(1)
        if (hasUpgrade("e", 32)) mult = mult.times(upgradeEffect("e", 32))
        if (hasUpgrade("e", 33)) mult = mult.times(10)

        if (getBuyableAmount("e", 12).gt(0)) mult = mult.times(buyableEffect("e", 12))

        if (hasUpgrade("ee", 12)) mult = mult.times(upgradeEffect("ee", 12))

        if (hasMilestone("t4", 5)) mult = mult.times(1000)

        return mult
    },
    passiveGeneration() {
        if (hasMilestone("ee", 3)) return 0.5;
        if (hasMilestone("ee", 2)) return 0.1;
        return 0;
    },
    autoUpgrade() { return hasMilestone("ee", 1) },
    gainExp() { // Calculate the exponent on main currency from bonuses
        let exp = new Decimal(1)
        if (hasUpgrade("e", 23)) exp = exp.add(0.1) // exponent = 0.5 * 1.1 = 0.55
        return exp
    },
    row: 0, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        { key: "e", description: "E: Reset for basic essence", onPress() { if (canReset(this.layer)) doReset(this.layer) } },
    ],
    layerShown() { return true },

    getCap() {
        if (player && player.v && player.v.chosen) return new Decimal(Infinity); // Effectively absolute no cap for Void
        let cap = new Decimal(1e25);
        if (player.ee && player.ee.unlocked) {
            cap = cap.times(Decimal.pow(1e5, getBuyableAmount("ee", 11)));
        }
        if (hasMilestone("t4", 1)) {
            cap = cap.times(new Decimal("1e100"));
        }
        if (hasMilestone("t4", 6)) {
            cap = cap.times(new Decimal("1e9000"));
        }
        if (player.ha && player.ha.unlocked) {
            cap = cap.times(Decimal.pow(new Decimal("1e50"), getBuyableAmount("ha", 11)));
        }
        return cap;
    },

    update(diff) {
        let cap = layers.e.getCap();
        if (player[this.layer].points.gte(cap)) {
            player[this.layer].points = cap;
        }

        if (hasMilestone("ee", 3)) {
            if (layers.e.buyables[11].unlocked() && layers.e.buyables[11].canAfford() && getBuyableAmount("e", 11).lt(layers.e.buyables[11].purchaseLimit)) {
                layers.e.buyables[11].buy()
            }
            if (layers.e.buyables[12].unlocked() && layers.e.buyables[12].canAfford() && getBuyableAmount("e", 12).lt(layers.e.buyables[12].purchaseLimit)) {
                layers.e.buyables[12].buy()
            }
        }
    },

    doReset(resettingLayer) {
        let keep = ["best"];
        if (hasUpgrade("w", 12) || hasMilestone("t4", 0)) keep.push("upgrades");
        if (hasUpgrade("wi", 12) || hasMilestone("t4", 0)) keep.push("buyables");
        if (layers[resettingLayer].row > this.row || resettingLayer == "ee") layerDataReset(this.layer, keep);
    },

    upgrades: {
        11: {
            title: "Mana Resonance",
            description: "Doubles mana generation.",
            cost: new Decimal(1),
        },
        12: {
            title: "Essence Channeling",
            description: "Boosts mana generation based on your unspent Basic Essence.",
            cost: new Decimal(2),
            unlocked() { return hasUpgrade("e", 11) },
            effect() {
                return player[this.layer].points.add(1).pow(0.5)
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" },
        },
        13: {
            title: "Mana Spring",
            description: "Adds a flat +5 to base mana generation.",
            cost: new Decimal(5),
            unlocked() { return hasUpgrade("e", 12) },
        },
        21: {
            title: "Magnetic Resonance",
            description: "Multiplies mana generation based on your current Mana.",
            cost: new Decimal(15),
            unlocked() { return hasUpgrade("e", 13) },
            effect() {
                return player.points.add(1).log10().add(1)
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" },
        },
        22: {
            title: "Improved Purity",
            description: "Lowers the Basic Essence prestige requirement from 10 to 5 Mana.",
            cost: new Decimal(50),
            unlocked() { return hasUpgrade("e", 21) },
        },
        23: {
            title: "Exponential Understanding",
            description: "Increases the exponent of the Basic Essence formula.",
            cost: new Decimal(250),
            unlocked() { return hasUpgrade("e", 22) },
        },
        31: {
            title: "Stabilized Dimensions",
            description: "Multiply mana generation by 5.",
            cost: new Decimal(1500),
            unlocked() { return hasUpgrade("e", 23) },
        },
        32: {
            title: "Limitless Knowledge",
            description: "Boosts Basic Essence gain multiplier based on your unspent Mana.",
            cost: new Decimal(10000),
            unlocked() { return hasUpgrade("e", 31) },
            effect() {
                return player.points.add(1).pow(0.15)
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" },
        },
        33: {
            title: "Seed of Singularity",
            description: "Multiply both mana generation and essence gain by 10.",
            cost: new Decimal(50000),
            unlocked() { return hasUpgrade("e", 32) },
        },
        41: {
            title: "Mana Forcefield",
            description: "Unlocks Essence Buyables.",
            cost: new Decimal(5e6),
            unlocked() { return hasUpgrade("e", 33) },
        },
    },

    buyables: {
        11: {
            cost(x) { return new Decimal(1e7).mul(Decimal.pow(3, x)) }, // Cost increases x3 each time
            purchaseLimit: new Decimal(20), // Max 20 purchases
            display() { return `<h2>Mana Amplifier</h2><br>Multiplies mana generation by 3.<br><br>Cost: ${formatWhole(this.cost())} Essence<br>Bought: ${getBuyableAmount(this.layer, this.id)} / ${formatWhole(this.purchaseLimit)}<br>Effect: x${formatWhole(this.effect())}` },
            canAfford() { return player[this.layer].points.gte(this.cost()) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost())
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            },
            effect(x) { return Decimal.pow(3, x) },
            unlocked() { return hasUpgrade("e", 41) }
        },
        12: {
            cost(x) { return new Decimal(5e7).mul(Decimal.pow(5, x)) }, // Cost increases x5 each time
            purchaseLimit: new Decimal(15), // Max 15 purchases
            display() { return `<h2>Essence Catalyst</h2><br>Multiplies basic essence gain by 2.<br><br>Cost: ${formatWhole(this.cost())} Essence<br>Bought: ${getBuyableAmount(this.layer, this.id)} / ${formatWhole(this.purchaseLimit)}<br>Effect: x${formatWhole(this.effect())}` },
            canAfford() { return player[this.layer].points.gte(this.cost()) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost())
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            },
            effect(x) { return Decimal.pow(2, x) },
            unlocked() { return hasUpgrade("e", 41) } // Assuming it's unlocked by the same upgrade
        }
    }
})

addLayer("ee", {
    name: "elemental",
    symbol: "✨",
    position: 1, // Branching path goes here, perhaps position 0 is time magic
    startData() {
        return {
            unlocked: false, // Hidden until you reach the requirement
            points: new Decimal(0),
            resets: new Decimal(0),
        }
    },
    onPrestige(gain) {
        if (!player.ee.resets) player.ee.resets = new Decimal(0);
        player.ee.resets = player.ee.resets.add(1);
    },
    color: "#ff4d4d", // Fire red
    requires: new Decimal(1e25), // Requires 10 Yotta Basic Essence
    resource: "elemental essence",
    baseResource: "basic essence",
    branches: ["e"],
    baseAmount() { return player.e.points },
    type: "normal",
    exponent: 0.5,
    gainMult() {
        let mult = new Decimal(1);
        if (player.f && player.f.unlocked) mult = mult.times(layers.f.effect());
        if (player.w && player.w.unlocked) mult = mult.times(layers.w.effect());
        if (player.ea && player.ea.unlocked) mult = mult.times(layers.ea.effect());
        if (player.wi && player.wi.unlocked) mult = mult.times(layers.wi.effect());
        return mult;
    },
    gainExp() {
        return new Decimal(1)
    },
    softcap: new Decimal("1e100"),
    softcapPower() {
        let scp = new Decimal(0.5);
        if (player.ha && player.ha.unlocked && getBuyableAmount("ha", 12).gt(0)) {
            scp = scp.add(buyableEffect("ha", 12));
        }
        return scp.min(1); // Cap at 1 (no softcap)
    },
    passiveGeneration() {
        if (hasMilestone("t4", 5)) return 0.1;
        return 0;
    },
    row: 0, // Changed to Row 0 so it sits to the right of 'e'
    hotkeys: [
        { key: "l", description: "L: Reset for elemental essence", onPress() { if (canReset(this.layer)) doReset(this.layer) } },
    ],
    layerShown() {
        if (!player) return false;
        return player.e.points.gte(1e25) || player[this.layer].unlocked
    }, // Show only when >= 1e25 essence OR already unlocked

    update(diff) {
        if (hasMilestone("t4", 0)) {
            if (layers.ee.buyables[11].unlocked() && layers.ee.buyables[11].canAfford() && getBuyableAmount("ee", 11).lt(layers.ee.buyables[11].purchaseLimit)) {
                layers.ee.buyables[11].buy()
            }
        }
    },

    doReset(resettingLayer) {
        let keep = ["best"];
        if (hasUpgrade("ea", 12) || hasMilestone("t4", 0)) keep.push("upgrades");
        if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep);
    },

    tabFormat: [
        "main-display",
        "prestige-button",
        "resource-display",
        ["display-text", function () {
            let scp = layers.ee.softcapPower();
            if (player.ee.points.gte(tmp.ee.softcap) && scp.lt(1)) {
                return `<br><h3 style='color: #ffaa00'>⚠️ Softcap Active: Gain past ${format(tmp.ee.softcap)} is raised to ^${format(scp, 3)}</h3><br>`;
            }
            return "";
        }],
        ["display-text", function () { return (player.ee.resets != undefined ? `<br><h3>You have performed ${formatWhole(player.ee.resets)} Elemental Resets.</h3><br>` : "") }],
        "milestones",
        "upgrades",
        "buyables"
    ],

    milestones: {
        0: {
            requirementDescription: "1 Elemental Reset",
            effectDescription: "Multiply Mana generation by 2.",
            done() { return (player.ee.resets && player.ee.resets.gte(1)) || hasMilestone("t4", 0) }
        },
        1: {
            requirementDescription: "3 Elemental Resets",
            effectDescription: "Auto-buy Basic Essence upgrades.",
            done() { return (player.ee.resets && player.ee.resets.gte(3)) || hasMilestone("t4", 0) }
        },
        2: {
            requirementDescription: "10 Elemental Resets",
            effectDescription: "Generate 10% of Basic Essence on reset per second.",
            done() { return (player.ee.resets && player.ee.resets.gte(10)) || hasMilestone("t4", 0) }
        },
        3: {
            requirementDescription: "15 Elemental Resets",
            effectDescription: "Auto-buy Basic Essence Buyables and generate 50% of Basic Essence on reset per second.",
            done() { return (player.ee.resets && player.ee.resets.gte(15)) || hasMilestone("t4", 0) }
        },
        4: {
            requirementDescription: "1e135 Elemental Essence",
            effectDescription: "Base gain of all four Elemental Essences is multiplied by x100.",
            done() { return player.ee.points.gte("1e135") || hasMilestone("t4", 0) }
        }
    },

    upgrades: {
        11: {
            title: "Elemental Affinity",
            description: "Boosts mana generation based on Elemental Essence.",
            cost: new Decimal(1),
            effect() {
                return player[this.layer].points.add(1).pow(2);
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" },
        },
        12: {
            title: "Essence Condenser",
            description: "Basic Essence gain is multiplied by 10.",
            cost: new Decimal(5),
            effect() {
                return new Decimal(10);
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" },
            unlocked() { return hasUpgrade("ee", 11) }
        },
        13: {
            title: "Cap Breakthrough",
            description: "Unlocks the Core Expansion Buyable to increase the Basic Essence cap.",
            cost: new Decimal(10),
            unlocked() { return hasUpgrade("ee", 12) }
        }
    },

    buyables: {
        11: {
            cost(x) { return new Decimal(2).mul(Decimal.pow(3, x)) },
            purchaseLimit: new Decimal(15),
            display() { return `<h2>Core Expansion</h2><br>Increases the Basic Essence cap by x100,000.<br><br>Cost: ${formatWhole(this.cost())} Elemental Essence<br>Bought: ${getBuyableAmount(this.layer, this.id)} / ${formatWhole(this.purchaseLimit)}<br>Effect: x${formatWhole(this.effect())} to Cap` },
            canAfford() { return player[this.layer].points.gte(this.cost()) && getBuyableAmount(this.layer, this.id).lt(this.purchaseLimit) },
            buy() {
                player[this.layer].points = player[this.layer].points.sub(this.cost())
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            },
            effect(x) { return Decimal.pow(1e5, x) },
            unlocked() { return hasUpgrade("ee", 13) }
        }
    },

    // For now, no upgrades, just a placeholder for the next tier.
})

// --- TIER 3: THE FOUR ELEMENTS ---

addLayer("f", {
    name: "fire",
    symbol: "🔥",
    position: 0,
    startData() {
        return {
            unlocked: false,
            points: new Decimal(0),
        }
    },
    color: "#ff3300",
    requires: new Decimal("1e40"),
    resource: "fire essence",
    baseResource: "elemental essence",
    baseAmount() { return player.ee.points },
    type: "normal",
    exponent: 0.1,
    gainMult() {
        let mult = new Decimal(1);
        if (hasMilestone("ee", 4)) mult = mult.times(100);
        return mult;
    },
    gainExp() { return new Decimal(1) },
    passiveGeneration() { return hasMilestone("t4", 7) ? 0.5 : 0; },
    row: 1,
    branches: ["ee"],
    layerShown() {
        if (!player) return false;
        return player.ee.points.gte("1e40") || player[this.layer].unlocked || (player.ee.resets && player.ee.resets.gte(1))
    },
    effect() {
        if (player.f.points.lt(1)) return new Decimal(1);
        let t = player.f.resetTime;
        let eff = new Decimal(10000).div(t + 1).add(1);
        if (hasUpgrade("w", 11)) eff = eff.times(100);
        if (hasUpgrade("f", 13)) eff = eff.times(upgradeEffect("f", 13));
        let penalties = (player.w.points.gte(1) ? 1 : 0) + (player.ea.points.gte(1) ? 1 : 0) + (player.wi.points.gte(1) ? 1 : 0);
        let penaltyBase = getPenaltyBase();
        if (penalties > 0) eff = eff.pow(Math.pow(penaltyBase, penalties));
        return eff;
    },
    effectDescription() {
        let text = `which acts as a rapidly decaying flame, multiplying Elemental Essence gain by <h2 style='color: #ff3300; text-shadow: 0 0 10px #ff3300'>x${format(this.effect())}</h2> and Mana generation by <h2 style='color: #ff3300; text-shadow: 0 0 10px #ff3300'>x${format(this.effect().pow(0.25))}</h2>.`;
        if (player.f.points.lt(1)) text += `<br><i>(Requires 1 Fire Essence to activate)</i>`;
        let penalties = (player.w.points.gte(1) ? 1 : 0) + (player.ea.points.gte(1) ? 1 : 0) + (player.wi.points.gte(1) ? 1 : 0);
        let penaltyBase = getPenaltyBase();
        if (penalties > 0 && penaltyBase < 1) text += `<br><span style='color: #ff0000'><b>⚠️ PENALTY ACTIVE: Effectiveness reduced to ^${format(Math.pow(penaltyBase, penalties), 3)} due to ${penalties} other active element(s).</b><br><i>(Base: ^${format(penaltyBase, 2)} per element)</i></span>`;
        return text;
    },
    upgrades: {
        11: {
            title: "Thermal Clash",
            description: "Multiply Water's effect by 100.",
            cost: new Decimal(1),
            unlocked() { return player.f.points.gte(1) || hasUpgrade(this.layer, this.id) || player.t4.unlocked },
        },
        12: {
            title: "Controlled Burn",
            description: "Mitigates the elemental penalty from ^0.1 to ^0.5 per element.",
            cost: new Decimal(5),
            unlocked() { return ((hasUpgrade("ea", 12) || hasMilestone("t4", 0)) && (hasUpgrade("w", 12) || hasMilestone("t4", 0)) && (hasUpgrade("wi", 12) || hasMilestone("t4", 0))) || hasUpgrade(this.layer, this.id) || player.t4.unlocked },
        },
        13: {
            title: "Inferno Overflow",
            description: "Multiply this element's effect based on your Fire Essence.",
            cost: new Decimal(3e5),
            unlocked() { return hasMilestone("t4", 2) || hasUpgrade(this.layer, this.id) },
            effect() { return player.f.points.add(1).pow(0.5) },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" },
        }
    },
    clickables: {
        11: {
            display() { return "<b>Reset Elements</b><br>Refunds all elements (Fire, Water, Earth, Wind).<br>Does not affect Basic & Elemental Essences." },
            canClick() { return player.f.points.gte(1) || player.w.points.gte(1) || player.ea.points.gte(1) || player.wi.points.gte(1); },
            onClick() {
                if (!confirm("Reset all your active elements? You will lose their essences and buffs.")) return;
                player.f.points = new Decimal(0); player.f.resetTime = 0; player.f.unlocked = false;
                player.w.points = new Decimal(0); player.w.resetTime = 0; player.w.unlocked = false;
                player.ea.points = new Decimal(0); player.ea.resetTime = 0; player.ea.unlocked = false;
                player.wi.points = new Decimal(0); player.wi.resetTime = 0; player.wi.unlocked = false;
            },
            style: { width: "250px", minHeight: "60px", "margin-top": "20px", "background-color": "#ff4d4d", color: "white", border: "2px solid #aa0000" }
        }
    },
    doReset(resettingLayer) {
        let keep = [];
        if (hasMilestone("t4", 4)) keep.push("upgrades");
        if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep);
    }
})

addLayer("w", {
    name: "water",
    symbol: "💧",
    position: 1,
    startData() {
        return {
            unlocked: false,
            points: new Decimal(0),
        }
    },
    color: "#00bfff",
    requires: new Decimal("1e40"),
    resource: "water essence",
    baseResource: "elemental essence",
    baseAmount() { return player.ee.points },
    type: "normal",
    exponent: 0.1,
    gainMult() {
        let mult = new Decimal(1);
        if (hasMilestone("ee", 4)) mult = mult.times(100);
        return mult;
    },
    gainExp() { return new Decimal(1) },
    passiveGeneration() { return hasMilestone("t4", 7) ? 0.5 : 0; },
    row: 1,
    branches: ["ee"],
    layerShown() {
        if (!player) return false;
        return player.ee.points.gte("1e40") || player[this.layer].unlocked || (player.ee.resets && player.ee.resets.gte(1))
    },
    effect() {
        if (player.w.points.lt(1)) return new Decimal(1);
        let t = player.w.resetTime;
        let eff = new Decimal(t).pow(0.8).add(1);
        if (hasUpgrade("f", 11)) eff = eff.times(100);
        if (hasUpgrade("w", 13)) eff = eff.times(upgradeEffect("w", 13));
        let penalties = (player.f.points.gte(1) ? 1 : 0) + (player.ea.points.gte(1) ? 1 : 0) + (player.wi.points.gte(1) ? 1 : 0);
        let penaltyBase = getPenaltyBase();
        if (penalties > 0) eff = eff.pow(Math.pow(penaltyBase, penalties));
        return eff;
    },
    effectDescription() {
        let text = `which acts as a continuously surging river, multiplying Elemental Essence gain by <h2 style='color: #00bfff; text-shadow: 0 0 10px #00bfff'>x${format(this.effect())}</h2> and Mana generation by <h2 style='color: #00bfff; text-shadow: 0 0 10px #00bfff'>x${format(this.effect().pow(0.25))}</h2>.`;
        if (player.w.points.lt(1)) text += `<br><i>(Requires 1 Water Essence to activate)</i>`;
        let penalties = (player.f.points.gte(1) ? 1 : 0) + (player.ea.points.gte(1) ? 1 : 0) + (player.wi.points.gte(1) ? 1 : 0);
        let penaltyBase = getPenaltyBase();
        if (penalties > 0 && penaltyBase < 1) text += `<br><span style='color: #ff0000'><b>⚠️ PENALTY ACTIVE: Effectiveness reduced to ^${format(Math.pow(penaltyBase, penalties), 3)} due to ${penalties} other active element(s).</b><br><i>(Base: ^${format(penaltyBase, 2)} per element)</i></span>`;
        return text;
    },
    upgrades: {
        11: {
            title: "Evaporation",
            description: "Multiply Fire's effect by 100.",
            cost: new Decimal(1),
            unlocked() { return player.w.points.gte(1) || hasUpgrade(this.layer, this.id) || player.t4.unlocked },
        },
        12: {
            title: "Deep Current",
            description: "Keep Tier 1 (Basic Essence) Upgrades on reset.",
            cost: new Decimal(5),
            unlocked() { return hasUpgrade(this.layer, 11) || hasUpgrade(this.layer, this.id) || player.t4.unlocked },
        },
        13: {
            title: "Tsunami Surge",
            description: "Multiply this element's effect based on your Water Essence.",
            cost: new Decimal(3e5),
            unlocked() { return hasMilestone("t4", 2) || hasUpgrade(this.layer, this.id) },
            effect() { return player.w.points.add(1).pow(0.5) },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" },
        }
    },
    clickables: {
        11: {
            display() { return "<b>Reset Elements</b><br>Refunds all elements (Fire, Water, Earth, Wind).<br>Does not affect Basic & Elemental Essences." },
            canClick() { return player.f.points.gte(1) || player.w.points.gte(1) || player.ea.points.gte(1) || player.wi.points.gte(1); },
            onClick() {
                if (!confirm("Reset all your active elements? You will lose their essences and buffs.")) return;
                player.f.points = new Decimal(0); player.f.resetTime = 0; player.f.unlocked = false;
                player.w.points = new Decimal(0); player.w.resetTime = 0; player.w.unlocked = false;
                player.ea.points = new Decimal(0); player.ea.resetTime = 0; player.ea.unlocked = false;
                player.wi.points = new Decimal(0); player.wi.resetTime = 0; player.wi.unlocked = false;
            },
            style: { width: "250px", minHeight: "60px", "margin-top": "20px", "background-color": "#ff4d4d", color: "white", border: "2px solid #aa0000" }
        }
    },
    doReset(resettingLayer) {
        let keep = [];
        if (hasMilestone("t4", 4)) keep.push("upgrades");
        if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep);
    }
})

addLayer("ea", {
    name: "earth",
    symbol: "⛰️",
    position: 2,
    startData() {
        return {
            unlocked: false,
            points: new Decimal(0),
        }
    },
    color: "#8b4513",
    requires: new Decimal("1e40"),
    resource: "earth essence",
    baseResource: "elemental essence",
    baseAmount() { return player.ee.points },
    type: "normal",
    exponent: 0.1,
    gainMult() {
        let mult = new Decimal(1);
        if (hasMilestone("ee", 4)) mult = mult.times(100);
        return mult;
    },
    gainExp() { return new Decimal(1) },
    passiveGeneration() { return hasMilestone("t4", 7) ? 0.5 : 0; },
    row: 1,
    branches: ["ee"],
    layerShown() {
        if (!player) return false;
        return player.ee.points.gte("1e40") || player[this.layer].unlocked || (player.ee.resets && player.ee.resets.gte(1))
    },
    effect() {
        if (player.ea.points.lt(1)) return new Decimal(1);
        let eff = Decimal.log10(player.e.best.add(10)).pow(2.2); // Slower scaling based on log
        if (hasUpgrade("wi", 11)) eff = eff.times(100);
        if (hasUpgrade("ea", 13)) eff = eff.times(upgradeEffect("ea", 13));
        let penalties = (player.f.points.gte(1) ? 1 : 0) + (player.w.points.gte(1) ? 1 : 0) + (player.wi.points.gte(1) ? 1 : 0);
        let penaltyBase = getPenaltyBase();
        if (penalties > 0) eff = eff.pow(Math.pow(penaltyBase, penalties));
        return eff;
    },
    effectDescription() {
        let text = `which acts as a solid unmoving cornerstone, multiplying Elemental Essence gain by <h2 style='color: #8b4513; text-shadow: 0 0 10px #8b4513'>x${format(this.effect())}</h2> and Mana generation by <h2 style='color: #8b4513; text-shadow: 0 0 10px #8b4513'>x${format(this.effect().pow(0.25))}</h2> based on your ALL-TIME highest Basic Essence.`;
        if (player.ea.points.lt(1)) text += `<br><i>(Requires 1 Earth Essence to activate)</i>`;
        let penalties = (player.f.points.gte(1) ? 1 : 0) + (player.w.points.gte(1) ? 1 : 0) + (player.wi.points.gte(1) ? 1 : 0);
        let penaltyBase = getPenaltyBase();
        if (penalties > 0 && penaltyBase < 1) text += `<br><span style='color: #ff0000'><b>⚠️ PENALTY ACTIVE: Effectiveness reduced to ^${format(Math.pow(penaltyBase, penalties), 3)} due to ${penalties} other active element(s).</b><br><i>(Base: ^${format(penaltyBase, 2)} per element)</i></span>`;
        return text;
    },
    upgrades: {
        11: {
            title: "Dust Devil",
            description: "Multiply Wind's effect by 100.",
            cost: new Decimal(1),
            unlocked() { return player.ea.points.gte(1) || hasUpgrade(this.layer, this.id) || player.t4.unlocked },
        },
        12: {
            title: "Bedrock Foundation",
            description: "Keep Tier 2 (Elemental Essence) Upgrades on reset.",
            cost: new Decimal(5),
            unlocked() { return hasUpgrade(this.layer, 11) || hasUpgrade(this.layer, this.id) || player.t4.unlocked },
        },
        13: {
            title: "Tectonic Shift",
            description: "Multiply this element's effect based on your Earth Essence.",
            cost: new Decimal(3e5),
            unlocked() { return hasMilestone("t4", 2) || hasUpgrade(this.layer, this.id) },
            effect() { return player.ea.points.add(1).pow(0.5) },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" },
        }
    },
    clickables: {
        11: {
            display() { return "<b>Reset Elements</b><br>Refunds all elements (Fire, Water, Earth, Wind).<br>Does not affect Basic & Elemental Essences." },
            canClick() { return player.f.points.gte(1) || player.w.points.gte(1) || player.ea.points.gte(1) || player.wi.points.gte(1); },
            onClick() {
                if (!confirm("Reset all your active elements? You will lose their essences and buffs.")) return;
                player.f.points = new Decimal(0); player.f.resetTime = 0; player.f.unlocked = false;
                player.w.points = new Decimal(0); player.w.resetTime = 0; player.w.unlocked = false;
                player.ea.points = new Decimal(0); player.ea.resetTime = 0; player.ea.unlocked = false;
                player.wi.points = new Decimal(0); player.wi.resetTime = 0; player.wi.unlocked = false;
            },
            style: { width: "250px", minHeight: "60px", "margin-top": "20px", "background-color": "#ff4d4d", color: "white", border: "2px solid #aa0000" }
        }
    },
    doReset(resettingLayer) {
        let keep = [];
        if (hasMilestone("t4", 4)) keep.push("upgrades");
        if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep);
    }
})

addLayer("wi", {
    name: "wind",
    symbol: "🌪️",
    position: 3,
    startData() {
        return {
            unlocked: false,
            points: new Decimal(0),
        }
    },
    color: "#e6e6fa",
    requires: new Decimal("1e40"),
    resource: "wind essence",
    baseResource: "elemental essence",
    baseAmount() { return player.ee.points },
    type: "normal",
    exponent: 0.1,
    gainMult() {
        let mult = new Decimal(1);
        if (hasMilestone("ee", 4)) mult = mult.times(100);
        return mult;
    },
    gainExp() { return new Decimal(1) },
    passiveGeneration() { return hasMilestone("t4", 7) ? 0.5 : 0; },
    row: 1,
    branches: ["ee"],
    layerShown() {
        if (!player) return false;
        return player.ee.points.gte("1e40") || player[this.layer].unlocked || (player.ee.resets && player.ee.resets.gte(1))
    },
    effect() {
        if (player.wi.points.lt(1)) return new Decimal(1);
        let t = player.wi.resetTime;
        let wave = Math.sin(t * 0.5); // Adjust frequency
        let eff = new Decimal(wave).times(2499.5).add(2500.5); // Fluctuates between 1 and 5000
        if (hasUpgrade("ea", 11)) eff = eff.times(100);
        if (hasUpgrade("wi", 13)) eff = eff.times(upgradeEffect("wi", 13));
        let penalties = (player.f.points.gte(1) ? 1 : 0) + (player.w.points.gte(1) ? 1 : 0) + (player.ea.points.gte(1) ? 1 : 0);
        let penaltyBase = getPenaltyBase();
        if (penalties > 0) eff = eff.pow(Math.pow(penaltyBase, penalties));
        return eff;
    },
    effectDescription() {
        let text = `which acts as a turbulent storm, wildly fluctuating Elemental Essence gain by <h2 style='color: #e6e6fa; text-shadow: 0 0 10px #e6e6fa'>x${format(this.effect())}</h2> and Mana generation by <h2 style='color: #e6e6fa; text-shadow: 0 0 10px #e6e6fa'>x${format(this.effect().pow(0.25))}</h2>.`;
        if (player.wi.points.lt(1)) text += `<br><i>(Requires 1 Wind Essence to activate)</i>`;
        let penalties = (player.f.points.gte(1) ? 1 : 0) + (player.w.points.gte(1) ? 1 : 0) + (player.ea.points.gte(1) ? 1 : 0);
        let penaltyBase = getPenaltyBase();
        if (penalties > 0 && penaltyBase < 1) text += `<br><span style='color: #ff0000'><b>⚠️ PENALTY ACTIVE: Effectiveness reduced to ^${format(Math.pow(penaltyBase, penalties), 3)} due to ${penalties} other active element(s).</b><br><i>(Base: ^${format(penaltyBase, 2)} per element)</i></span>`;
        return text;
    },
    upgrades: {
        11: {
            title: "Erosion",
            description: "Multiply Earth's effect by 100.",
            cost: new Decimal(1),
            unlocked() { return player.wi.points.gte(1) || hasUpgrade(this.layer, this.id) || player.t4.unlocked },
        },
        12: {
            title: "Eternal Breeze",
            description: "Keep Tier 1 (Basic Essence) Buyables on reset.",
            cost: new Decimal(5),
            unlocked() { return hasUpgrade(this.layer, 11) || hasUpgrade(this.layer, this.id) || player.t4.unlocked },
        },
        13: {
            title: "Hurricane Force",
            description: "Multiply this element's effect based on your Wind Essence.",
            cost: new Decimal(3e5),
            unlocked() { return hasMilestone("t4", 2) || hasUpgrade(this.layer, this.id) },
            effect() { return player.wi.points.add(1).pow(0.5) },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" },
        }
    },
    clickables: {
        11: {
            display() { return "<b>Reset Elements</b><br>Refunds all elements (Fire, Water, Earth, Wind).<br>Does not affect Basic & Elemental Essences." },
            canClick() { return player.f.points.gte(1) || player.w.points.gte(1) || player.ea.points.gte(1) || player.wi.points.gte(1); },
            onClick() {
                if (!confirm("Reset all your active elements? You will lose their essences and buffs.")) return;
                player.f.points = new Decimal(0); player.f.resetTime = 0; player.f.unlocked = false;
                player.w.points = new Decimal(0); player.w.resetTime = 0; player.w.unlocked = false;
                player.ea.points = new Decimal(0); player.ea.resetTime = 0; player.ea.unlocked = false;
                player.wi.points = new Decimal(0); player.wi.resetTime = 0; player.wi.unlocked = false;
            },
            style: { width: "250px", minHeight: "60px", "margin-top": "20px", "background-color": "#ff4d4d", color: "white", border: "2px solid #aa0000" }
        }
    },
    doReset(resettingLayer) {
        let keep = [];
        if (hasMilestone("t4", 4)) keep.push("upgrades");
        if (layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep);
    }
})

// --- TIER 4 ---

addLayer("t4", {
    name: "Aether",
    symbol: "🌌",
    position: 0,
    startData() {
        return {
            unlocked: false,
            points: new Decimal(0),
        }
    },
    color: "#ffffff",
    requires: new Decimal("1e40"),
    resource: "aether",
    baseResource: "elemental essence",
    baseAmount() { return player.ee.points },
    type: "normal",
    exponent: 0.1,
    gainMult() {
        let mult = new Decimal(1);
        if (player.ha && player.ha.unlocked && getBuyableAmount("ha", 14).gt(0)) {
            mult = mult.times(buyableEffect("ha", 14));
        }
        return mult;
    },
    gainExp() { return new Decimal(1) },
    row: 2,
    branches: ["f", "w", "ea", "wi"],
    passiveGeneration() {
        return (player.v && player.v.chosen) ? 0.5 : 0;
    },
    layerShown() {
        if (!player) return false;
        let hasEssences = player.f.points.gte(1) && player.w.points.gte(1) && player.ea.points.gte(1) && player.wi.points.gte(1);
        let hasEE = player.ee.points.gte("1e40");
        return (hasEssences && hasEE) || player[this.layer].unlocked;
    },
    canReset() {
        if (!player) return false;
        return player.f.points.gte(1) && player.w.points.gte(1) && player.ea.points.gte(1) && player.wi.points.gte(1) && player.ee.points.gte(tmp[this.layer].requires);
    },
    prestigeButtonText() {
        return "Reset for <b>" + formatWhole(tmp[this.layer].resetGain) + "</b> Aether<br><br>Requires: 1 of each Elemental Essence and " + format(tmp[this.layer].requires) + " Elemental Essence";
    },
    onPrestige(gain) {
        player.f.points = player.f.points.sub(1).max(0);
        player.w.points = player.w.points.sub(1).max(0);
        player.ea.points = player.ea.points.sub(1).max(0);
        player.wi.points = player.wi.points.sub(1).max(0);
    },
    update(diff) {
        if (hasMilestone("t4", 0)) {
            if (!hasUpgrade("w", 12)) player.w.upgrades.push(12);
            if (!hasUpgrade("ea", 12)) player.ea.upgrades.push(12);
            if (!hasUpgrade("wi", 12)) player.wi.upgrades.push(12);
        }
        // Force unlock Tier 5 Dualities so TMT engine allows clicks
        if (player.t4.points.gte("1e1022")) {
            if (player.p && player.p.unlocked === false) player.p.unlocked = true;
            if (player.v && player.v.unlocked === false) player.v.unlocked = true;
        }
    },
    milestones: {
        0: {
            requirementDescription: "1 Aether",
            effectDescription: "Keep Elemental Essence milestones up to 4 and automate its Buyables. Retain Water, Earth, and Wind's elemental preservation upgrades permanently.",
            done() { return player.t4.points.gte(1) }
        },
        1: {
            requirementDescription: "2 Aether",
            effectDescription: "Increase the Basic Essence cap by x1e100.",
            done() { return player.t4.points.gte(2) }
        },
        2: {
            requirementDescription: "200,000 Aether",
            effectDescription: "Unlock a new 3rd Upgrade (13) for all four Tier 3 elements.",
            done() { return player.t4.points.gte(200000) }
        },
        3: {
            requirementDescription: "500,000 Aether",
            effectDescription: "Unlock the Harmony module to synthesize new hybrid elements.",
            done() { return player.t4.points.gte(500000) }
        },
        4: {
            requirementDescription: "10,000,000 Aether",
            effectDescription: "Keep Element Essence upgrades permanently.",
            done() { return player.t4.points.gte(10000000) }
        },
        5: {
            requirementDescription: "200,000,000 Aether",
            effectDescription: "Generate 10% of Elemental Essence on reset per second, and Basic Essence gain is multiplied by 1000.",
            done() { return player.t4.points.gte(200000000) }
        },
        6: {
            requirementDescription: "1e70 Aether",
            effectDescription: "Increase the Basic Essence cap by x1e9000.",
            done() { return player.t4.points.gte("1e70") }
        },
        7: {
            requirementDescription: "1e1000 Aether",
            effectDescription: "Generate 50% of the reset amount for all four Elemental Essences per second.",
            done() { return player.t4.points.gte("1e1000") }
        },
        8: {
            requirementDescription: "1e1022 Aether",
            effectDescription: "Unlock the next tier (The Duality: Plenum & Void).",
            done() { return player.t4.points.gte("1e1022") }
        }
    }
})

// --- HARMONY ---

addLayer("ha", {
    name: "Harmony",
    symbol: "☯️",
    position: 1,
    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
        }
    },
    color: "#ff00ff",
    resource: "harmony",
    type: "none",
    row: 2,
    branches: ["t4"],
    layerShown() {
        if (!player) return false;
        return hasMilestone("t4", 3);
    },
    tooltip() { return "Harmony" },
    shouldNotify() {
        // Check if any of the Omni-Essences can be synthesized
        let canBuy11 = layers.ha.buyables[11].canAfford();
        let canBuy12 = layers.ha.buyables[12].canAfford();
        let canBuy13 = layers.ha.buyables[13].canAfford();
        let canBuy14 = layers.ha.buyables[14].canAfford();
        return canBuy11 || canBuy12 || canBuy13 || canBuy14;
    },
    tabFormat: [
        "blank",
        ["display-text", function () { return "<h2>Harmony Crucible</h2><br>Combine four Elemental Essences to create advanced Omni-Essences.<br>" }],
        "blank",
        ["display-text", function () { return "<h3 style='color: #ffffff'>Ultimate Hybrids</h3>" }],
        "buyables",
    ],
    buyables: {
        11: {
            title: "<span style='color: white; text-shadow: 1px 1px 2px black;'>Omni-Essence 🌟</span>",
            purchaseLimit: new Decimal(16),
            cost(x) {
                return {
                    f: new Decimal(500000).times(Decimal.pow(2, x)),
                    w: new Decimal(300000).times(Decimal.pow(2, x)),
                    ea: new Decimal(100000).times(Decimal.pow(2, x)),
                    wi: new Decimal(100000).times(Decimal.pow(2, x))
                }
            },
            display() {
                let costInfo = this.cost(getBuyableAmount(this.layer, this.id));
                let isMax = getBuyableAmount(this.layer, this.id).gte(this.purchaseLimit);
                let costText = isMax ? "<br><br><b>MAX LEVEL REACHED</b>" : `<br><br>Cost:<br>🔥 ${formatWhole(costInfo.f)} Fire<br>💧 ${formatWhole(costInfo.w)} Water<br>⛰️ ${formatWhole(costInfo.ea)} Earth<br>🌪️ ${formatWhole(costInfo.wi)} Wind`;
                return `<span style='color: white; text-shadow: 1px 1px 2px black;'><b>Synthesize Omni-Essence</b><br><i>(Increases Basic Essence Cap by x1e50)</i>${costText}<br><br><i>Omni-Essences Owned: ${formatWhole(getBuyableAmount(this.layer, this.id))} / ${formatWhole(this.purchaseLimit)}</i></span>`
            },
            canAfford() {
                if (getBuyableAmount(this.layer, this.id).gte(this.purchaseLimit)) return false;
                let costInfo = this.cost(getBuyableAmount(this.layer, this.id));
                return player.f.points.gte(costInfo.f) && player.w.points.gte(costInfo.w) && player.ea.points.gte(costInfo.ea) && player.wi.points.gte(costInfo.wi);
            },
            buy() {
                let costInfo = this.cost(getBuyableAmount(this.layer, this.id));
                player.f.points = player.f.points.sub(costInfo.f);
                player.w.points = player.w.points.sub(costInfo.w);
                player.ea.points = player.ea.points.sub(costInfo.ea);
                player.wi.points = player.wi.points.sub(costInfo.wi);
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1));
            },
            effect(x) { return new Decimal("1e50").pow(x) },
            style() {
                return {
                    width: "250px",
                    minHeight: "150px",
                    "background-color": "#202020",
                    "border-color": this.canAfford() ? "#00ff00" : "#ff00ff",
                    "border-width": "3px",
                    "margin": "10px"
                }
            }
        },
        12: {
            title: "<span style='color: white; text-shadow: 1px 1px 2px black;'>Omni-Essence 💫</span>",
            purchaseLimit: new Decimal(25),
            cost(x) {
                return {
                    f: new Decimal(1e9).times(Decimal.pow(5, x)),
                    w: new Decimal(1e9).times(Decimal.pow(5, x)),
                    ea: new Decimal(1e9).times(Decimal.pow(5, x)),
                    wi: new Decimal(5e8).times(Decimal.pow(5, x))
                }
            },
            display() {
                let costInfo = this.cost(getBuyableAmount(this.layer, this.id));
                let isMax = getBuyableAmount(this.layer, this.id).gte(this.purchaseLimit);
                let currentPower = new Decimal(0.5).add(buyableEffect(this.layer, this.id)).min(1);
                let costText = isMax ? "<br><br><b>MAX LEVEL REACHED</b>" : `<br><br>Cost:<br>🔥 ${formatWhole(costInfo.f)} Fire<br>💧 ${formatWhole(costInfo.w)} Water<br>⛰️ ${formatWhole(costInfo.ea)} Earth<br>🌪️ ${formatWhole(costInfo.wi)} Wind`;
                return `<span style='color: white; text-shadow: 1px 1px 2px black;'><b>Synthesize Omni-Essence</b><br><i>(Weakens Elemental Essence softcap by +${format(buyableEffect(this.layer, this.id).add(new Decimal(0.02)).mul(100).sub(buyableEffect(this.layer, this.id).mul(100)))}%)</i>${costText}<br><br><i>Omni-Essences Owned: ${formatWhole(getBuyableAmount(this.layer, this.id))} / ${format(this.purchaseLimit)}</i><br><i>Current Power: ^${format(currentPower)} (Max ^1.0)</i></span>`
            },
            canAfford() {
                if (getBuyableAmount(this.layer, this.id).gte(this.purchaseLimit)) return false;
                let costInfo = this.cost(getBuyableAmount(this.layer, this.id));
                return player.f.points.gte(costInfo.f) && player.w.points.gte(costInfo.w) && player.ea.points.gte(costInfo.ea) && player.wi.points.gte(costInfo.wi);
            },
            buy() {
                let costInfo = this.cost(getBuyableAmount(this.layer, this.id));
                player.f.points = player.f.points.sub(costInfo.f);
                player.w.points = player.w.points.sub(costInfo.w);
                player.ea.points = player.ea.points.sub(costInfo.ea);
                player.wi.points = player.wi.points.sub(costInfo.wi);
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1));
            },
            effect(x) { return new Decimal(0.02).times(x) },
            style() {
                return {
                    width: "250px",
                    minHeight: "150px",
                    "background-color": "#202020",
                    "border-color": this.canAfford() ? "#00ff00" : "#ff00ff",
                    "border-width": "3px",
                    "margin": "10px"
                }
            }
        },
        13: {
            title: "<span style='color: white; text-shadow: 1px 1px 2px black;'>Omni-Essence ✨</span>",
            purchaseLimit: new Decimal(10),
            cost(x) {
                return {
                    f: new Decimal(5e9).times(Decimal.pow(5, x)),
                    w: new Decimal(1e10).times(Decimal.pow(5, x)),
                    ea: new Decimal(1e10).times(Decimal.pow(5, x)),
                    wi: new Decimal(1e10).times(Decimal.pow(5, x))
                }
            },
            display() {
                let costInfo = this.cost(getBuyableAmount(this.layer, this.id));
                let isMax = getBuyableAmount(this.layer, this.id).gte(this.purchaseLimit) || getPenaltyBase() >= 1;
                let costText = isMax ? "<br><br><b>MAX LEVEL REACHED</b>" : `<br><br>Cost:<br>🔥 ${formatWhole(costInfo.f)} Fire<br>💧 ${formatWhole(costInfo.w)} Water<br>⛰️ ${formatWhole(costInfo.ea)} Earth<br>🌪️ ${formatWhole(costInfo.wi)} Wind`;
                return `<span style='color: white; text-shadow: 1px 1px 2px black;'><b>Synthesize Omni-Essence</b><br><i>(Weakens element penalty base by +0.05)</i>${costText}<br><br><i>Omni-Essences Owned: ${formatWhole(getBuyableAmount(this.layer, this.id))} / ${format(this.purchaseLimit)}</i><br><i>Penalty Base: ^${format(new Decimal(getPenaltyBase()))} (Max ^1.0)</i></span>`
            },
            canAfford() {
                if (getBuyableAmount(this.layer, this.id).gte(this.purchaseLimit) || getPenaltyBase() >= 1) return false;
                let costInfo = this.cost(getBuyableAmount(this.layer, this.id));
                return player.f.points.gte(costInfo.f) && player.w.points.gte(costInfo.w) && player.ea.points.gte(costInfo.ea) && player.wi.points.gte(costInfo.wi);
            },
            buy() {
                let costInfo = this.cost(getBuyableAmount(this.layer, this.id));
                player.f.points = player.f.points.sub(costInfo.f);
                player.w.points = player.w.points.sub(costInfo.w);
                player.ea.points = player.ea.points.sub(costInfo.ea);
                player.wi.points = player.wi.points.sub(costInfo.wi);
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1));
            },
            effect(x) { return new Decimal(0.05).times(x) },
            style() {
                return {
                    width: "250px",
                    minHeight: "150px",
                    "background-color": "#202020",
                    "border-color": this.canAfford() ? "#00ff00" : "#ff00ff",
                    "border-width": "3px",
                    "margin": "10px"
                }
            }
        },
        14: {
            title: "<span style='color: white; text-shadow: 1px 1px 2px black;'>Omni-Essence 🌀</span>",
            purchaseLimit: new Decimal(40),
            cost(x) {
                return {
                    f: new Decimal("1e60").times(Decimal.pow(1e10, x)),
                    w: new Decimal("1e60").times(Decimal.pow(1e10, x)),
                    ea: new Decimal("1e60").times(Decimal.pow(1e10, x)),
                    wi: new Decimal("1e60").times(Decimal.pow(1e10, x))
                }
            },
            display() {
                let costInfo = this.cost(getBuyableAmount(this.layer, this.id));
                let isMax = getBuyableAmount(this.layer, this.id).gte(this.purchaseLimit);
                let costText = isMax ? "<br><br><b>MAX LEVEL REACHED</b>" : `<br><br>Cost:<br>🔥 ${format(costInfo.f)} Fire<br>💧 ${format(costInfo.w)} Water<br>⛰️ ${format(costInfo.ea)} Earth<br>🌪️ ${format(costInfo.wi)} Wind`;
                return `<span style='color: white; text-shadow: 1px 1px 2px black;'><b>Synthesize Omni-Essence</b><br><i>(Multiplies Aether gain by x1e10)</i>${costText}<br><br><i>Omni-Essences Owned: ${formatWhole(getBuyableAmount(this.layer, this.id))} / ${formatWhole(this.purchaseLimit)}</i><br><i>Current Power: x${format(buyableEffect(this.layer, this.id))}</i></span>`
            },
            canAfford() {
                if (getBuyableAmount(this.layer, this.id).gte(this.purchaseLimit)) return false;
                let costInfo = this.cost(getBuyableAmount(this.layer, this.id));
                return player.f.points.gte(costInfo.f) && player.w.points.gte(costInfo.w) && player.ea.points.gte(costInfo.ea) && player.wi.points.gte(costInfo.wi);
            },
            buy() {
                let costInfo = this.cost(getBuyableAmount(this.layer, this.id));
                player.f.points = player.f.points.sub(costInfo.f);
                player.w.points = player.w.points.sub(costInfo.w);
                player.ea.points = player.ea.points.sub(costInfo.ea);
                player.wi.points = player.wi.points.sub(costInfo.wi);
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1));
            },
            effect(x) { return Decimal.pow(1e10, x) },
            style() {
                return {
                    width: "250px",
                    minHeight: "150px",
                    "background-color": "#202020",
                    "border-color": this.canAfford() ? "#00ff00" : "#ff00ff",
                    "border-width": "3px",
                    "margin": "10px"
                }
            }
        }
    }
})

// Achievements Side Layer
addLayer("a", {
    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
        }
    },
    color: "#ffff00",
    row: "side",
    layerShown() { return true },
    tooltip() { return "Achievements" },
    achievements: {
        11: {
            name: "<span style='font-size: 40px'>🔮</span>",
            popupName: "The Spark of Magic",
            done() { return player.e.points.gte(1) },
            tooltip: "<b>The Spark of Magic</b><br>Gain your first Basic Essence.",
            unlocked() { return true },
        },
        12: {
            name: "<span style='font-size: 40px'>✨</span>",
            popupName: "Breaking the Limits",
            done() { return player.ee.resets && player.ee.resets.gte(1) },
            tooltip: "<b>Breaking the Limits</b><br>Perform an Elemental Reset.",
            unlocked() { return true },
        },
        13: {
            name: "<div style='font-size: 13px; line-height: 1.1; margin-top: 5px;'>✨✨✨✨✨<br>✨✨✨✨✨<br>✨✨✨✨✨</div>",
            popupName: "Automation Era",
            done() { return player.ee.resets && player.ee.resets.gte(15) },
            tooltip: "<b>Automation Era</b><br>Perform 15 Elemental Resets.",
            unlocked() { return true },
        },
        14: {
            name: "<div style='font-size: 24px; line-height: 1.2; margin-top: 10px;'>🔥💧<br>⛰️🌪️</div>",
            popupName: "Master of Elements",
            done() { return player.f.points.gte(1) && player.w.points.gte(1) && player.ea.points.gte(1) && player.wi.points.gte(1) },
            tooltip: "<b>Master of Elements</b><br>Possess at least 1 of all four Elemental Essences.",
            unlocked() { return true },
        },
        15: {
            name: "<span style='font-size: 40px'>🌌</span>",
            popupName: "Cosmic Fusion",
            done() { return player.t4.unlocked },
            tooltip: "<b>Cosmic Fusion</b><br>Unlock the Aether node.",
            unlocked() { return true },
        },
        16: {
            name: "<div style='width: 36px; height: 36px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, white 10%, transparent 40%), radial-gradient(circle at 70% 70%, black 10%, transparent 40%), linear-gradient(135deg, white 50%, black 50%); box-shadow: 0 0 10px #aa00ff; margin: 10px auto 0 auto;'></div>",
            popupName: "A Step Towards the Singularity",
            done() { return (player.p && player.p.chosen) || (player.v && player.v.chosen); },
            tooltip: "<b>A Step Towards the Singularity</b><br>Choose a path in Tier 5.",
            unlocked() { return true },
        },
    },
    tabFormat: [
        "blank",
        ["display-text", function () { return "<h2>Achievements</h2><br>Complete challenges to earn badges." }],
        "blank", "blank",
        "achievements",
    ],
})

// --- TIER 5: THE DUALITY ---

addLayer("p", {
    name: "plenum",
    symbol: "🔆",
    position: 0,
    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
            chosen: false, // Indicates if the player has committed to this path
        }
    },
    color: "#ffdd00",
    nodeStyle: {
        "box-shadow": "0 0 15px 5px #ffdd00, 0 0 30px 10px #ffffff",
        "animation": "pulse 2s infinite",
        "background-color": "#ffffff",
        "border": "4px solid #ffcc00",
        "color": "black"
    },
    requires: new Decimal("1e1022"),
    resource: "plenum points",
    baseResource: "aether",
    baseAmount() { return player.t4.points },
    type: "none", // Manual progression
    row: 3,
    branches: ["t4"],
    unlocked() { return true; },
    layerShown() {
        if (!player) return false;
        if (player.v && player.v.chosen) return false;
        return player.t4.points.gte("1e1022") || player.p.chosen;
    },

    tabFormat: [
        "main-display",
        ["display-text", function () { return `<h2>The Realm of Plenum</h2><br>An endless expanse of creation and infinite growth.` }],
        "blank",
        ["clickables", [1]],
        "blank",
        ["display-text", function () {
            if (player.p.chosen) return `<i>You have embraced the Plenum. The universe expands boundlessly.</i>`;
            return "";
        }],
    ],

    clickables: {
        11: {
            title: "<h1>EMBRACE PLENUM</h1>",
            display() {
                return `Ascend to the Realm of Fullness.<br><br><b>WARNING: You cannot choose the Void on this run once you confirm.</b><br><i>(However, you will eventually need to explore both paths for true progression.)</i>`
            },
            canClick() { return !player.p.chosen && !player.v.chosen && player.t4.points.gte("1e1022"); },
            onClick() {
                player.p.chosen = true;
                player.p.points = new Decimal(1);
                player.p.unlocked = true;
                // No hard reset here, saved for higher tier
            },
            style: { width: "400px", minHeight: "150px", "background-color": "#ffaa00", color: "black", border: "4px solid white", "border-radius": "15px" }
        }
    }
})

addLayer("v", {
    name: "void",
    symbol: "🕳️",
    position: 1,
    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
            depth: new Decimal(0),
            chosen: false, // Indicates if the player has committed to this path
            reactor: {
                amounts: [new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)] // Thruster, Condenser, Erodent, Accelerator
            }
        }
    },
    color: "#330066",
    nodeStyle: {
        "box-shadow": "inset 0 0 15px 15px #000000, 0 0 10px 2px #5500aa",
        "animation": "pulse 1s infinite alternate-reverse",
        "background-color": "#1a0033",
        "border": "4px dotted #330066",
        "color": "white"
    },
    requires: new Decimal("1e1022"),
    resource: "void points",
    baseResource: "aether",
    baseAmount() { return player.t4.points },
    type: "none", // Manual progression
    row: 3,
    branches: ["t4"],
    unlocked() { return true; },
    layerShown() {
        if (!player || !player.t4 || !player.v || !player.p) return false;
        return player.t4.points.gte("1e1022") || player.v.chosen || player.p.chosen;
    },
    getDrainRates(ignoreHunger) {
        let baseDrain = new Decimal(1);
        if (hasMilestone("v", 2)) {
            let milestoneCount = player.v.milestones ? player.v.milestones.length : 0;
            baseDrain = baseDrain.times(new Decimal(100).pow(milestoneCount));
        }

        // --- Catalyst Bonus to EE Drain (Milestone 4) ---
        if (player.v.reactor && hasMilestone("v", 4)) {
            let catalystFlux = player.v.reactor.amounts[1] || new Decimal(0);
            if (catalystFlux.gt(0)) {
                let effect = new Decimal(1.7).pow(catalystFlux);
                if (hasUpgrade("v", 34)) effect = effect.pow(1.5); // Upg 34 Amplification
                baseDrain = baseDrain.times(effect);
            }
        }

        let aetherDrain = new Decimal(1);
        if (hasUpgrade("v", 14) && !ignoreHunger) aetherDrain = aetherDrain.times(upgradeEffect("v", 14));
        if (hasUpgrade("v", 11)) aetherDrain = aetherDrain.times(10);
        if (hasUpgrade("v", 12)) aetherDrain = aetherDrain.times(upgradeEffect("v", 12));

        aetherDrain = aetherDrain.times(getBuyableAmount("v", 11).gt(0) ? buyableEffect("v", 11) : 1);
        if (hasUpgrade("v", 22)) aetherDrain = aetherDrain.times(upgradeEffect("v", 22));
        if (hasUpgrade("v", 23)) aetherDrain = aetherDrain.times(upgradeEffect("v", 23));
        if (getBuyableAmount("v", 12).gt(0)) aetherDrain = aetherDrain.pow(buyableEffect("v", 12));

        // Apply 10m depth milestone effect to base 4 elements (f, w, ea, wi)
        // Applies as a multiplier to the base drain
        let elementMult = new Decimal(1);
        let drainPow = new Decimal(1); // For 4 basic elements
        let aetherDrainPow = new Decimal(1); // Specifically nerfed for Aether
        let currentDepth = player.v ? (player.v.depth || new Decimal(0)) : new Decimal(0);

        if (hasMilestone("v", 0)) {
            // multiplier: 1 + depth^2
            elementMult = currentDepth.pow(2).add(1);
        }

        if (hasMilestone("v", 1)) {
            // exponent multiplier for elements: 1 + depth^0.1
            drainPow = currentDepth.pow(0.1).add(1);
            // exponent multiplier for aether (significantly weaker): 1 + log10(depth+1)^0.5 * 0.1
            aetherDrainPow = new Decimal(1).add(currentDepth.add(1).log10().pow(0.5).times(0.1));
        }

        // --- VOID REACTOR BONUSES ---
        if (player.v.reactor && hasUpgrade("v", 33)) {

            // 4. Accelerator (Aether Extractor) -> Power boost
            let accelFlux = player.v.reactor.amounts[3];
            if (accelFlux.gt(0)) {
                let accelDiv = hasUpgrade("v", 34) ? 500 : 1000; // Upg 34 Amplification (twice as potent)
                aetherDrainPow = aetherDrainPow.add(accelFlux.div(accelDiv));
            }
        }

        aetherDrain = aetherDrain.pow(aetherDrainPow);

        return { base: baseDrain, aether: aetherDrain, elementMult: elementMult, drainPow: drainPow };
    },
    update(diff) {
        if (player.v.chosen) {
            let rates = layers.v.getDrainRates();
            player.v.maxEEDrain = Decimal.max(new Decimal(player.v.maxEEDrain || 0), rates.base);

            let baseDrain = rates.base;
            let aetherDrain = rates.aether;

            let drainAmt = baseDrain.times(diff);
            let aetherDrainAmt = aetherDrain.times(diff);
            let elementDrainAmt = baseDrain.max(1).times(rates.elementMult).pow(rates.drainPow).times(diff);
            let totalDrained = new Decimal(0);

            // Minor essences and base mana are reserved for later anomaly stages.
            // Right now, Abyssal Depths directly consumes the 4 fundamental elements
            if (hasUpgrade("v", 32)) {
                if (player.f) {
                    let fDrained = Decimal.min(player.f.points, elementDrainAmt);
                    player.f.points = player.f.points.sub(fDrained).max(1);
                    totalDrained = totalDrained.add(fDrained);
                }
                if (player.w) {
                    let wDrained = Decimal.min(player.w.points, elementDrainAmt);
                    player.w.points = player.w.points.sub(wDrained).max(1);
                    totalDrained = totalDrained.add(wDrained);
                }
                if (player.ea) {
                    let eaDrained = Decimal.min(player.ea.points, elementDrainAmt);
                    player.ea.points = player.ea.points.sub(eaDrained).max(1);
                    totalDrained = totalDrained.add(eaDrained);
                }
                if (player.wi) {
                    let wiDrained = Decimal.min(player.wi.points, elementDrainAmt);
                    player.wi.points = player.wi.points.sub(wiDrained).max(1);
                    totalDrained = totalDrained.add(wiDrained);
                }

                // Currently, mana and primary essence (e) remain untouched as they are sealed away in WIP safely.

                // Elemental essence begins to drain after Upgrade 33 is purchased
                if (hasUpgrade("v", 33) && player.ee) {
                    let eeDrained = Decimal.min(player.ee.points, drainAmt);
                    player.ee.points = player.ee.points.sub(eeDrained).max(1);
                    totalDrained = totalDrained.add(eeDrained);
                }
            }

            let t4Drained = Decimal.min(player.t4.points, aetherDrainAmt);
            player.t4.points = player.t4.points.sub(t4Drained).max(1);
            totalDrained = totalDrained.add(t4Drained);

            if (hasUpgrade("v", 13)) totalDrained = totalDrained.times(10);



            player.v.points = player.v.points.add(totalDrained);
            // We'll calculate display gen rate on the fly too to avoid saving it
        }

        // Abyssal Depths Drilling Mechanic
        if (hasUpgrade("v", 32)) {
            // Base drill speed: 1m/s
            // Slows down based on current depth: Speed = 1 / (1 + depth^1.05)
            // To make it meaningful, we might scale this later, but for now this adds steady depth
            let currentDepth = player.v.depth || new Decimal(0);
            let drillSpeed = new Decimal(1).div(currentDepth.pow(1.05).add(1));

            // 5m Depth Milestone effect: 5x Drill Speed
            if (hasMilestone("v", 0)) {
                drillSpeed = drillSpeed.times(5);
            }

            // Void Reactor (Thruster) Bonus
            if (player.v.reactor && hasUpgrade("v", 33)) {
                let thrusterFlux = player.v.reactor.amounts[0];
                if (thrusterFlux.gt(0)) {
                    let effect = new Decimal(1).add(thrusterFlux.add(1).log10().times(2));
                    if (hasUpgrade("v", 34)) effect = effect.pow(1.5); // Upg 34 Amplification
                    drillSpeed = drillSpeed.times(effect);
                }
            }

            // 30m Depth Milestone effect: Drill speed boosted slightly by elemental drain
            if (hasMilestone("v", 1)) {
                let rates = layers.v.getDrainRates();
                let drainPerSec = rates.base.max(1).times(rates.elementMult).pow(rates.drainPow);
                let speedBoost = drainPerSec.max(1).log10().add(1).pow(0.5); // ^0.5 root of log10
                drillSpeed = drillSpeed.times(speedBoost);
            }

            player.v.depth = currentDepth.add(drillSpeed.times(diff));
        }
    },

    microtabs: {
        stuff: {
            "Main": {
                content: [
                    ["display-text", function () {
                        if (player.v.chosen) {
                            let rates = layers.v.getDrainRates();
                            let displayGen = rates.aether; // negligible base elements
                            if (hasUpgrade("v", 13)) displayGen = displayGen.times(10);
                            return `<i>You have embraced the Void. All things return to nothingness.</i><br><br><h3 style="color: red">WARNING:<br>Your Basic Essence Cap has been annihilated.<br>Memory of lower dimensions is locked.</h3><br><h2 style="color: #ffffff; text-shadow: 0 0 10px #aaaaaa">Void Essence Drained: ${format(player.v.points)}<br><span style="font-size: 16px">(+${format(displayGen)}/s)</span></h2>`;
                        }
                        return "";
                    }],
                    "blank",
                    ["display-text", function () { return player.v.chosen ? "<h3>Aether Drain Progress</h3>" : ""; }],
                    "blank",
                    ["row", [["bar", "t4Bar"]]],
                    "blank",
                    "upgrades",
                    "blank",
                    "buyables"
                ]
            },
            "Abyssal Depths": {
                unlocked() { return hasUpgrade("v", 32); },
                content: [
                    ["display-text", function () {
                        let currentDepth = player.v.depth || new Decimal(0);
                        let drillSpeed = new Decimal(1).div(currentDepth.pow(1.05).add(1));
                        if (hasMilestone("v", 0)) drillSpeed = drillSpeed.times(5);
                        if (hasMilestone("v", 1)) {
                            let rates = layers.v.getDrainRates();
                            let drainPerSec = rates.base.max(1).times(rates.elementMult).pow(rates.drainPow);
                            drillSpeed = drillSpeed.times(drainPerSec.max(1).log10().add(1).pow(0.5));
                        }

                        return `<h3>The deepest reaches of the Void</h3><br>` +
                            `You have pierced through the boundary of existence.<br><br>` +
                            `<h2 style="color: #ffffff; text-shadow: 0 0 10px #aaaaaa">Current Depth: ${format(currentDepth)} m</h2><br>` +
                            `Drill Speed: ${format(drillSpeed)} m/s (Slowing down due to abyssal pressure) <br><br>` +
                            `<i>More features will be revealed here soon.</i>`
                    }],
                    "blank",
                    ["display-text", function () { return player.v.chosen ? "<h3>Elemental Drain Progress</h3>" : ""; }],
                    "blank",
                    ["row", [["bar", "fBar"]]],
                    ["row", [["bar", "wBar"]]],
                    ["row", [["bar", "eaBar"]]],
                    ["row", [["bar", "wiBar"]]],
                    "blank",
                    ["milestones", [0, 1, 2, 3, 4]]
                ]
            },
            "Elemental Erosion": {
                unlocked() { return hasUpgrade("v", 33); },
                content: [
                    ["display-text", function () {
                        return `<h3>The Fabric of the Elements is Tearing</h3><br>` +
                            `The depth of the abyss has caused a critical fracture. Elemental Essence is now bleeding into the Void.<br><br>`
                    }],
                    "blank",
                    ["display-text", function () { return player.v.chosen ? "<h3>Elemental Essence Drain Progress</h3>" : ""; }],
                    "blank",
                    ["row", [["bar", "eeBar"]]],
                    "blank",
                    "blank",
                    ["display-text", function () {
                        if (!player.v || !player.v.reactor) return "";
                        let totalFlux = layers.v.getReactorFlux();
                        let usedFlux = layers.v.getReactorAllocated();
                        return `<div style="border: 2px solid #8800ff; border-radius: 10px; padding: 15px; background-color: #110022;">
                            <h2 style="color: #dd00ff; text-shadow: 0 0 10px #aa00ff;">Void Reactor</h2>
                            <h3 style="color: white;">Decay Flux: ${formatWhole(usedFlux)} / ${formatWhole(totalFlux)}</h3>
                            <i style="color: #aaaaaa; font-size: 12px;">Flux is generated based on the magnitude of your Elemental Essence drain.</i>
                            <br><br>
                            <table style="width: 100%; text-align: left; color: white;">`
                    }],
                    ["display-text", function () {
                        return `<tr>
                                    <td style="width: 30%; padding-bottom: 15px;"><b>Thruster</b> <br><span style="font-size: 10px; color: #aaaaaa;">(Drill Speed)</span></td>
                                    <td style="width: 20%; color: #00ffff; padding-bottom: 15px;">Allocated: ${formatWhole(player.v.reactor.amounts[0])}</td>
                                    <td style="width: 25%; color: #bbffbb; padding-bottom: 15px;">Effect: x${format((hasUpgrade('v', 34)) ? new Decimal(1).add(player.v.reactor.amounts[0].add(1).log10().times(2)).pow(1.5) : new Decimal(1).add(player.v.reactor.amounts[0].add(1).log10().times(2)))}</td>
                                    <td style="width: 25%; text-align: right; padding-bottom: 15px;">`
                    }],
                    ["row", [["clickable", 61], ["clickable", 31], ["clickable", 21], ["clickable", 41]]],
                    ["display-text", function () {
                        let html = `</td></tr>`;
                        if (hasMilestone("v", 4)) {
                            let effect = new Decimal(1.7).pow(player.v.reactor.amounts[1]);
                            if (hasUpgrade("v", 34)) effect = effect.pow(1.5);
                            html += `<tr><td colspan="4"><hr style="border-color: #330055; margin: 15px 0;"></td></tr>
                                <tr>
                                    <td style="padding-bottom: 15px;"><b>Catalyst</b> <br><span style="font-size: 10px; color: #aaaaaa;">(EE Drain)</span></td>
                                    <td style="color: #00ffff; padding-bottom: 15px;">Allocated: ${formatWhole(player.v.reactor.amounts[1])}</td>
                                    <td style="color: #bbffbb; padding-bottom: 15px;">Effect: x${format(effect)}</td>
                                    <td style="text-align: right; padding-bottom: 15px;">`;
                        }
                        return html;
                    }],
                    ["row", [["clickable", 62], ["clickable", 32], ["clickable", 22], ["clickable", 42]]],
                    ["display-text", function () {
                        return `</td></tr><tr><td colspan="4"><hr style="border-color: #330055; margin: 15px 0;"></td></tr>
                                <tr>
                                    <td style="padding-bottom: 15px;"><b>Accelerator</b> <br><span style="font-size: 10px; color: #aaaaaa;">(Aether Drain)</span></td>
                                    <td style="color: #00ffff; padding-bottom: 15px;">Allocated: ${formatWhole(player.v.reactor.amounts[3])}</td>
                                    <td style="color: #bbffbb; padding-bottom: 15px;">Effect: ^${format(new Decimal(1).add(player.v.reactor.amounts[3].div(hasUpgrade('v', 34) ? 500 : 1000)))}</td>
                                    <td style="text-align: right; padding-bottom: 15px;">`
                    }],
                    ["row", [["clickable", 64], ["clickable", 34], ["clickable", 24], ["clickable", 44]]],
                    ["display-text", function () {
                        return `</td></tr></table><br></div>`
                    }],
                    "blank",
                    ["row", [["clickable", 51]]]
                ]
            },
            "WIP": {
                unlocked() { return player.v.chosen; },
                content: [
                    ["display-text", function () { return player.v.chosen ? "<h3>Minor Essences Drain Progress</h3>" : ""; }],
                    "blank",
                    ["row", [["bar", "manaBar"]]],
                    ["row", [["bar", "eBar"]]]
                ]
            }
        }
    },

    tabFormat: [
        ["display-text", function () { return `<h2>The Realm of Void</h2><br>An absolute vacuum that devours all existence.` }],
        "blank",
        ["clickables", [1]],
        "blank",
        ["microtabs", "stuff"]
    ],

    milestones: {
        0: {
            requirementDescription: "10m Depth Reached",
            effectDescription: "The drill hits a hollow pocket, permanently multiplying drill speed by 5x. Furthermore, the immense deep-void pressure causes the drainage of the 4 basic elements (Fire, Water, Earth, Wind) to be multiplied based on your depth.",
            done() { return player.v && player.v.depth && player.v.depth.gte(10) },
            style() {
                if (hasMilestone(this.layer, this.id)) return { 'background-color': '#332255', 'color': 'white' };
                return { 'background-color': '#111122', 'color': '#555555' };
            }
        },
        1: {
            requirementDescription: "30m Depth Reached",
            effectDescription: "The Void's grasp tightens. Aether and the 4 basic elements' drain rates are raised to a power multiplier based on depth. Additionally, drill speed is slightly boosted proportionally to the massive elemental drain rate.",
            done() { return player.v && player.v.depth && player.v.depth.gte(30) },
            style() {
                if (hasMilestone(this.layer, this.id)) return { 'background-color': '#441144', 'color': 'white' };
                return { 'background-color': '#111122', 'color': '#555555' };
            }
        },
        2: {
            requirementDescription: "60m Depth Reached",
            effectDescription: "The abyssal weight crushes everything. Multiply Elemental Essence drain speed by 100x for every Void milestone you have achieved.",
            done() { return player.v && player.v.depth && player.v.depth.gte(60) },
            style() {
                if (hasMilestone(this.layer, this.id)) return { 'background-color': '#551155', 'color': 'white' };
                return { 'background-color': '#111122', 'color': '#555555' };
            }
        },
        3: {
            requirementDescription: "120m Depth Reached",
            effectDescription: "The core of the Void begins to react. Decay Flux capacity from Elemental Erosion is permanently doubled.",
            done() { return player.v && player.v.depth && player.v.depth.gte(120) },
            style() {
                if (hasMilestone(this.layer, this.id)) return { 'background-color': '#660066', 'color': 'white' };
                return { 'background-color': '#111122', 'color': '#555555' };
            }
        },
        4: {
            requirementDescription: "250m Depth Reached",
            effectDescription: "The abyssal depths unlock a new Catalyst stream in the Void Reactor, amplifying Elemental Essence drain in exchange for Decay Flux.",
            done() { return player.v && player.v.depth && player.v.depth.gte(250) },
            style() {
                if (hasMilestone(this.layer, this.id)) return { 'background-color': '#770077', 'color': 'white' };
                return { 'background-color': '#111122', 'color': '#555555' };
            }
        }
    },

    upgrades: {
        11: {
            title: "Event Horizon",
            description: "Multiply Aether drain speed by 10.",
            cost: new Decimal(20),
            unlocked() { return player.v.chosen; },
            style() {
                if (hasUpgrade(this.layer, this.id)) return { "background-color": "#444444", "color": "white", "border": "2px solid #ffffff" };
                if (canAffordUpgrade(this.layer, this.id)) return { "background-color": "#222222", "color": "white", "border": "2px solid #aaaaaa", "cursor": "pointer" };
                return { "background-color": "#111111", "color": "#888", "border": "1px solid #555555", "cursor": "not-allowed" };
            }
        },
        12: {
            title: "Mass Collapse",
            description: "Aether drain speed multiplies based on Void Essence.",
            cost: new Decimal(200),
            unlocked() { return hasUpgrade("v", 11); },
            effect() {
                return player.v.points.max(1).pow(0.15).max(1);
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" },
            style() {
                if (hasUpgrade(this.layer, this.id)) return { "background-color": "#444444", "color": "white", "border": "2px solid #ffffff" };
                if (canAffordUpgrade(this.layer, this.id)) return { "background-color": "#222222", "color": "white", "border": "2px solid #aaaaaa", "cursor": "pointer" };
                return { "background-color": "#111111", "color": "#888", "border": "1px solid #555555", "cursor": "not-allowed" };
            }
        },
        13: {
            title: "Maw of the Abyss",
            description: "Gain 10x more Void Essence from drained resources.",
            cost: new Decimal(3000),
            unlocked() { return hasUpgrade("v", 12); },
            style() {
                if (hasUpgrade(this.layer, this.id)) return { "background-color": "#444444", "color": "white", "border": "2px solid #ffffff" };
                if (canAffordUpgrade(this.layer, this.id)) return { "background-color": "#222222", "color": "white", "border": "2px solid #aaaaaa", "cursor": "pointer" };
                return { "background-color": "#111111", "color": "#888", "border": "1px solid #555555", "cursor": "not-allowed" };
            }
        },
        14: {
            title: "Hunger of the Void",
            description: "Aether drain speed speeds up based on the number of Void upgrades owned (x1.5 per upgrade).",
            cost: new Decimal(30000),
            unlocked() { return hasUpgrade("v", 13); },
            effect() {
                let upgs = player.v.upgrades.length;
                return Decimal.pow(1.5, upgs);
            },
            effectDisplay() { return format(this.effect()) + "x" },
            style() {
                if (hasUpgrade(this.layer, this.id)) return { "background-color": "#444444", "color": "white", "border": "2px solid #ffffff" };
                if (canAffordUpgrade(this.layer, this.id)) return { "background-color": "#222222", "color": "white", "border": "2px solid #aaaaaa", "cursor": "pointer" };
                return { "background-color": "#111111", "color": "#888", "border": "1px solid #555555", "cursor": "not-allowed" };
            }
        },
        21: {
            title: "Dimensional Fade",
            description: "Reduces the cost scaling of Abyssal Resonance from x10 to x3 per purchase.",
            cost: new Decimal(100000),
            unlocked() { return hasUpgrade("v", 14); },
            style() {
                if (hasUpgrade(this.layer, this.id)) return { "background-color": "#444444", "color": "white", "border": "2px solid #ffffff" };
                if (canAffordUpgrade(this.layer, this.id)) return { "background-color": "#222222", "color": "white", "border": "2px solid #aaaaaa", "cursor": "pointer" };
                return { "background-color": "#111111", "color": "#888", "border": "1px solid #555555", "cursor": "not-allowed" };
            }
        },
        22: {
            title: "Aetherial Devourer",
            description: "Void Essence boosts Aether drain speed.",
            cost: new Decimal("1e134"),
            unlocked() { return hasUpgrade("v", 21); },
            effect() {
                return player.v.points.max(1).pow(0.05).max(1);
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" },
            style() {
                if (hasUpgrade(this.layer, this.id)) return { "background-color": "#444444", "color": "white", "border": "2px solid #ffffff" };
                if (canAffordUpgrade(this.layer, this.id)) return { "background-color": "#222222", "color": "white", "border": "2px solid #aaaaaa", "cursor": "pointer" };
                return { "background-color": "#111111", "color": "#888", "border": "1px solid #555555", "cursor": "not-allowed" };
            }
        },
        23: {
            title: "Aetherial Resonance",
            description: "Aether amplifies its own drain speed.",
            cost: new Decimal("1e143"),
            unlocked() { return hasUpgrade("v", 22); },
            effect() {
                return player.t4.points.max(1).pow(0.005).max(1);
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id)) + "x" },
            style() {
                if (hasUpgrade(this.layer, this.id)) return { "background-color": "#444444", "color": "white", "border": "2px solid #ffffff" };
                if (canAffordUpgrade(this.layer, this.id)) return { "background-color": "#222222", "color": "white", "border": "2px solid #aaaaaa", "cursor": "pointer" };
                return { "background-color": "#111111", "color": "#888", "border": "1px solid #555555", "cursor": "not-allowed" };
            }
        },
        24: {
            title: "Abyssal Transcendence",
            description: "Abyssal Resonance is 100x more powerful.",
            cost: new Decimal("1e5563"),
            unlocked() { return hasUpgrade("v", 23); },
            style() {
                if (hasUpgrade(this.layer, this.id)) return { "background-color": "#444444", "color": "white", "border": "2px solid #ffffff" };
                if (canAffordUpgrade(this.layer, this.id)) return { "background-color": "#222222", "color": "white", "border": "2px solid #aaaaaa", "cursor": "pointer" };
                return { "background-color": "#111111", "color": "#888", "border": "1px solid #555555", "cursor": "not-allowed" };
            }
        },
        31: {
            title: "Aetherial Awakening",
            description: "Unlocks the second Void Buyable.",
            cost: new Decimal("1e6079"),
            unlocked() { return hasUpgrade("v", 24); },
            style() {
                if (hasUpgrade(this.layer, this.id)) return { "background-color": "#444444", "color": "white", "border": "2px solid #ffffff" };
                if (canAffordUpgrade(this.layer, this.id)) return { "background-color": "#222222", "color": "white", "border": "2px solid #aaaaaa", "cursor": "pointer" };
                return { "background-color": "#111111", "color": "#888", "border": "1px solid #555555", "cursor": "not-allowed" };
            }
        },
        32: {
            title: "Beyond the Abyss",
            description: "Unlocks a new tab for 4 Basic Elements Drain.",
            cost: new Decimal("1e12674"),
            unlocked() { return hasUpgrade("v", 31); },
            style() {
                if (hasUpgrade(this.layer, this.id)) return { "background-image": "linear-gradient(45deg, #ff4d4d, #00bfff, #8b4513, #e6e6fa)", "color": "white", "border": "2px solid #ffffff", "text-shadow": "0 0 5px black" };
                if (canAffordUpgrade(this.layer, this.id)) return { "background-image": "linear-gradient(45deg, #ff4d4d, #00bfff, #8b4513, #e6e6fa)", "color": "white", "border": "2px solid #aaaaaa", "cursor": "pointer", "text-shadow": "0 0 5px black" };
                return { "background-color": "#111111", "color": "#888", "border": "1px solid #555555", "cursor": "not-allowed" };
            }
        },
        33: {
            title: "Dimensional Fracture",
            description: "Unlocks a new tab for Elemental Essence Drain.",
            cost: new Decimal("1e17000"),
            unlocked() { return hasUpgrade("v", 32); },
            style() {
                if (hasUpgrade(this.layer, this.id)) return { "background-color": "#ff4d4d", "color": "white", "border": "2px solid #ffffff" };
                if (canAffordUpgrade(this.layer, this.id)) return { "background-color": "#ff4d4d", "color": "white", "border": "2px solid #aaaaaa", "cursor": "pointer" };
                return { "background-color": "#111111", "color": "#888", "border": "1px solid #555555", "cursor": "not-allowed" };
            }
        },
        34: {
            title: "Resonant Overload",
            description: "Empower the Void Reactor. Flux allocation effects are significantly amplified.",
            cost: new Decimal("1e18000"),
            unlocked() { return hasUpgrade("v", 33); },
            style() {
                if (hasUpgrade(this.layer, this.id)) return { "background-color": "#444444", "color": "white", "border": "2px solid #ffffff" };
                if (canAffordUpgrade(this.layer, this.id)) return { "background-color": "#222222", "color": "white", "border": "2px solid #aaaaaa", "cursor": "pointer" };
                return { "background-color": "#111111", "color": "#888", "border": "1px solid #555555", "cursor": "not-allowed" };
            }
        }
    },

    buyables: {
        11: {
            title: "Abyssal Resonance",
            cost(x) {
                let x_num = new Decimal(x);
                let eff_x = new Decimal(x);
                if (x_num.gte(150)) {
                    eff_x = eff_x.add(x_num.sub(150).pow(2.35));
                }
                if (x_num.gte(300)) {
                    eff_x = eff_x.add(x_num.sub(300).pow(4));
                }
                let baseCost = new Decimal(100000);
                let multiplier = hasUpgrade("v", 21) ? new Decimal(3) : new Decimal(10);
                return baseCost.times(Decimal.pow(multiplier, eff_x));
            },
            effect(x) {
                let purchases = new Decimal(x);
                let baseMult = hasUpgrade("v", 24) ? 500 : 5;
                let eff;
                if (purchases.gte(249)) {
                    eff = new Decimal("1e21700").times(Decimal.pow(baseMult, purchases.sub(249)));
                } else {
                    eff = Decimal.pow(baseMult, purchases);
                }
                return eff;
            },
            display() {
                let baseMult = hasUpgrade("v", 24) ? 500 : 5;
                return `Multiply the drain speed of Aether by x${formatWhole(baseMult)} per purchase.<br><br>` +
                    `Cost: ${format(this.cost(getBuyableAmount(this.layer, this.id)))} Void Essence<br>` +
                    `Amount: ${getBuyableAmount(this.layer, this.id)}<br>` +
                    `Effect: x${format(buyableEffect(this.layer, this.id))}`
            },
            unlocked() { return player && player.v && hasUpgrade("v", 14); },
            canAfford() { return player.v.points.gte(this.cost(getBuyableAmount(this.layer, this.id))) },
            buy() {
                while (this.canAfford()) {
                    player.v.points = player.v.points.sub(this.cost(getBuyableAmount(this.layer, this.id)));
                    setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1));
                }
            },
            style() {
                if (this.canAfford()) return { "background-color": "#660099", "color": "white", "border": "2px solid white", "cursor": "pointer" };
                return { "background-color": "#220033", "color": "#888", "border": "1px solid #aa00ff", "cursor": "not-allowed" };
            }
        },
        12: {
            title: "Aetherial Infusion",
            cost(x) {
                let eff_x = new Decimal(x);
                let baseCost = new Decimal("1e6000");
                // Multiplier follows log-jump sequence: 100, 150, 250, 450...
                // Increment series: 50 + 50 * 2^x
                // Integral/Sum: 50*x + 50*(2^x - 1)
                let logMult = eff_x.times(50).add(Decimal.pow(2, eff_x).sub(1).times(50));
                return baseCost.times(Decimal.pow(10, logMult));
            },
            effect(x) {
                // Returns 1 + 0.1 * purchases
                return new Decimal(1).add(new Decimal(x).times(0.1));
            },
            display() {
                return `Raise Aether drain speed to the power of 1.1 per purchase.<br><br>` +
                    `Cost: ${format(this.cost(getBuyableAmount(this.layer, this.id)))} Void Essence<br>` +
                    `Amount: ${getBuyableAmount(this.layer, this.id)}<br>` +
                    `Effect: ^${format(buyableEffect(this.layer, this.id))}`
            },
            unlocked() { return hasUpgrade("v", 31); },
            canAfford() { return player.v.points.gte(this.cost(getBuyableAmount(this.layer, this.id))) },
            buy() {
                while (this.canAfford()) {
                    player.v.points = player.v.points.sub(this.cost(getBuyableAmount(this.layer, this.id)));
                    setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1));
                }
            },
            style() {
                if (this.canAfford()) return { "background-color": "#660099", "color": "white", "border": "2px solid white", "cursor": "pointer" };
                return { "background-color": "#220033", "color": "#888", "border": "1px solid #aa00ff", "cursor": "not-allowed" };
            }
        }
    },

    bars: {
        manaBar: {
            direction: RIGHT,
            width: 400,
            height: 30,
            progress() {
                if (!player.v || !player.v.chosen) return 0;
                let rates = layers.v.getDrainRates();
                let logPoints = Math.max(1, player.points.max(1).log10());
                return 1 - Math.min(1, rates.base.max(1).log10() / logPoints);
            },
            display() {
                if (!player.v.chosen) return "";
                let rates = layers.v.getDrainRates();
                return `Mana: ${format(player.points)} (-${format(rates.base)}/s)`;
            },
            unlocked() { return player.v.chosen },
            fillStyle: { "background-color": "#00aaff" },
            borderStyle: { "border": "2px solid #005588", "margin-bottom": "5px" },
            textStyle: { "color": "black", "font-weight": "bold", "text-shadow": "0px 0px 2px white" }
        },
        eBar: {
            direction: RIGHT,
            width: 400,
            height: 30,
            progress() {
                if (!player.v || !player.v.chosen) return 0;
                let rates = layers.v.getDrainRates();
                let logPoints = Math.max(1, player.e.points.max(1).log10());
                return 1 - Math.min(1, rates.base.max(1).log10() / logPoints);
            },
            display() {
                if (!player.v.chosen) return "";
                let rates = layers.v.getDrainRates();
                return `Basic Essence: ${format(player.e.points)} (-${format(rates.base)}/s)`;
            },
            unlocked() { return player.v.chosen },
            fillStyle: { "background-color": "#ffff00" },
            borderStyle: { "border": "2px solid #888800", "margin-bottom": "5px" },
            textStyle: { "color": "black", "font-weight": "bold", "text-shadow": "0px 0px 2px white" }
        },
        eeBar: {
            direction: RIGHT,
            width: 400,
            height: 30,
            progress() {
                if (!player.v || !player.v.chosen) return 0;
                let rates = layers.v.getDrainRates();
                let logPoints = Math.max(1, player.ee.points.max(1).log10());
                return 1 - Math.min(1, rates.base.max(1).log10() / logPoints);
            },
            display() {
                if (!player.v.chosen) return "";
                let rates = layers.v.getDrainRates();
                return `Elemental Essence: ${format(player.ee.points)} (-${format(rates.base)}/s)`;
            },
            unlocked() { return player.v.chosen },
            fillStyle: { "background-color": "#ff4d4d" },
            borderStyle: { "border": "2px solid #880000", "margin-bottom": "5px" },
            textStyle: { "color": "black", "font-weight": "bold", "text-shadow": "0px 0px 2px white" }
        },
        fBar: {
            direction: RIGHT,
            width: 400,
            height: 30,
            progress() {
                if (!player.v || !player.v.chosen) return 0;
                let rates = layers.v.getDrainRates();
                let drainRate = rates.base.max(1).times(rates.elementMult);
                let logPoints = Math.max(1, player.f.points.max(1).log10());
                return 1 - Math.min(1, drainRate.max(1).log10() / logPoints);
            },
            display() {
                if (!player.v.chosen) return "";
                let rates = layers.v.getDrainRates();
                let drainRate = rates.base.max(1).times(rates.elementMult);
                return `Fire: ${format(player.f.points)} (-${format(drainRate)}/s)`;
            },
            unlocked() { return player.v.chosen },
            fillStyle: { "background-color": "#ff5555" },
            borderStyle: { "border": "2px solid #882222", "margin-bottom": "5px" }
        },
        wBar: {
            direction: RIGHT,
            width: 400,
            height: 30,
            progress() {
                if (!player.v || !player.v.chosen) return 0;
                let rates = layers.v.getDrainRates();
                let drainRate = rates.base.max(1).times(rates.elementMult);
                let logPoints = Math.max(1, player.w.points.max(1).log10());
                return 1 - Math.min(1, drainRate.max(1).log10() / logPoints);
            },
            display() {
                if (!player.v.chosen) return "";
                let rates = layers.v.getDrainRates();
                let drainRate = rates.base.max(1).times(rates.elementMult);
                return `Water: ${format(player.w.points)} (-${format(drainRate)}/s)`;
            },
            unlocked() { return player.v.chosen },
            fillStyle: { "background-color": "#5555ff" },
            borderStyle: { "border": "2px solid #222288", "margin-bottom": "5px" }
        },
        eaBar: {
            direction: RIGHT,
            width: 400,
            height: 30,
            progress() {
                if (!player.v || !player.v.chosen) return 0;
                let rates = layers.v.getDrainRates();
                let drainRate = rates.base.max(1).times(rates.elementMult);
                let logPoints = Math.max(1, player.ea.points.max(1).log10());
                return 1 - Math.min(1, drainRate.max(1).log10() / logPoints);
            },
            display() {
                if (!player.v.chosen) return "";
                let rates = layers.v.getDrainRates();
                let drainRate = rates.base.max(1).times(rates.elementMult);
                return `Earth: ${format(player.ea.points)} (-${format(drainRate)}/s)`;
            },
            unlocked() { return player.v.chosen },
            fillStyle: { "background-color": "#aa5500" },
            borderStyle: { "border": "2px solid #552200", "margin-bottom": "5px" }
        },
        wiBar: {
            direction: RIGHT,
            width: 400,
            height: 30,
            progress() {
                if (!player.v || !player.v.chosen) return 0;
                let rates = layers.v.getDrainRates();
                let drainRate = rates.base.max(1).times(rates.elementMult);
                let logPoints = Math.max(1, player.wi.points.max(1).log10());
                return 1 - Math.min(1, drainRate.max(1).log10() / logPoints);
            },
            display() {
                if (!player.v.chosen) return "";
                let rates = layers.v.getDrainRates();
                let drainRate = rates.base.max(1).times(rates.elementMult);
                return `Wind: ${format(player.wi.points)} (-${format(drainRate)}/s)`;
            },
            unlocked() { return player.v.chosen },
            fillStyle: { "background-color": "#55aa55" },
            borderStyle: { "border": "2px solid #225522", "margin-bottom": "5px" }
        },
        t4Bar: {
            direction: RIGHT,
            width: 400,
            height: 30,
            progress() {
                if (!player.v || !player.v.chosen) return 0;
                let rates = layers.v.getDrainRates();
                let logPoints = Math.max(1, player.t4.points.max(1).log10());
                return 1 - Math.min(1, rates.aether.max(1).log10() / logPoints);
            },
            display() {
                if (!player.v.chosen) return "";
                let rates = layers.v.getDrainRates();
                return `Aether: ${format(player.t4.points)} (-${format(rates.aether)}/s)`;
            },
            unlocked() { return player.v.chosen },
            fillStyle: { "background-color": "#aa00ff" },
            borderStyle: { "border": "2px solid #550088" }
        }
    },

    getReactorFlux() {
        if (!player.v || !player.v.chosen || !hasUpgrade("v", 33)) return new Decimal(0);

        // Flux is based on the highest achieved Elemental Essence drain rate
        let eeDrain = new Decimal(player.v.maxEEDrain || 0).max(1);
        let flux = eeDrain.log10().floor(); // Base flux: scaling by log10 of MAX EE drain rate

        // 120m Depth Milestone effect: Double Flux capacity
        if (hasMilestone("v", 3)) {
            flux = flux.times(2);
        }

        return flux; // Total Flux capacity
    },
    getReactorAllocated() {
        if (!player.v || !player.v.reactor) return new Decimal(0);
        return player.v.reactor.amounts.reduce((a, b) => a.add(b), new Decimal(0));
    },

    clickables: {
        // --- VOID REACTOR ALLOCATION ---
        21: { title: "+1", display() { return ""; }, canClick() { return layers.v.getReactorAllocated().lt(layers.v.getReactorFlux()); }, onClick() { player.v.reactor.amounts[0] = player.v.reactor.amounts[0].add(1); }, style: { width: "30px", height: "30px", "min-height": "30px", "color": "white" } },
        22: { title: "+1", display() { return ""; }, unlocked() { return hasMilestone("v", 4); }, canClick() { return layers.v.getReactorAllocated().lt(layers.v.getReactorFlux()); }, onClick() { player.v.reactor.amounts[1] = player.v.reactor.amounts[1].add(1); }, style: { width: "30px", height: "30px", "min-height": "30px", "color": "white" } },
        24: { title: "+1", display() { return ""; }, canClick() { return layers.v.getReactorAllocated().lt(layers.v.getReactorFlux()); }, onClick() { player.v.reactor.amounts[3] = player.v.reactor.amounts[3].add(1); }, style: { width: "30px", height: "30px", "min-height": "30px", "color": "white" } },
        31: { title: "-1", display() { return ""; }, canClick() { return player.v.reactor.amounts[0].gt(0); }, onClick() { player.v.reactor.amounts[0] = player.v.reactor.amounts[0].sub(1).max(0); }, style: { width: "30px", height: "30px", "min-height": "30px", "color": "white" } },
        32: { title: "-1", display() { return ""; }, unlocked() { return hasMilestone("v", 4); }, canClick() { return player.v.reactor.amounts[1] && player.v.reactor.amounts[1].gt(0); }, onClick() { player.v.reactor.amounts[1] = player.v.reactor.amounts[1].sub(1).max(0); }, style: { width: "30px", height: "30px", "min-height": "30px", "color": "white" } },
        34: { title: "-1", display() { return ""; }, canClick() { return player.v.reactor.amounts[3].gt(0); }, onClick() { player.v.reactor.amounts[3] = player.v.reactor.amounts[3].sub(1).max(0); }, style: { width: "30px", height: "30px", "min-height": "30px", "color": "white" } },
        41: { title: "MAX", display() { return ""; }, canClick() { return layers.v.getReactorAllocated().lt(layers.v.getReactorFlux()); }, onClick() { player.v.reactor.amounts[0] = player.v.reactor.amounts[0].add(layers.v.getReactorFlux().sub(layers.v.getReactorAllocated())); }, style: { width: "40px", height: "30px", "min-height": "30px", "color": "white" } },
        42: { title: "MAX", display() { return ""; }, unlocked() { return hasMilestone("v", 4); }, canClick() { return layers.v.getReactorAllocated().lt(layers.v.getReactorFlux()); }, onClick() { player.v.reactor.amounts[1] = player.v.reactor.amounts[1].add(layers.v.getReactorFlux().sub(layers.v.getReactorAllocated())); }, style: { width: "40px", height: "30px", "min-height": "30px", "color": "white" } },
        44: { title: "MAX", display() { return ""; }, canClick() { return layers.v.getReactorAllocated().lt(layers.v.getReactorFlux()); }, onClick() { player.v.reactor.amounts[3] = player.v.reactor.amounts[3].add(layers.v.getReactorFlux().sub(layers.v.getReactorAllocated())); }, style: { width: "40px", height: "30px", "min-height": "30px", "color": "white" } },
        51: { title: "RES", display() { return "Clear All"; }, canClick() { return layers.v.getReactorAllocated().gt(0); }, onClick() { player.v.reactor.amounts[0] = new Decimal(0); player.v.reactor.amounts[1] = new Decimal(0); player.v.reactor.amounts[3] = new Decimal(0); }, style: { width: "80px", height: "30px", "min-height": "30px", "color": "white" } },
        61: { title: "MIN", display() { return ""; }, canClick() { return player.v.reactor.amounts[0].gt(0); }, onClick() { player.v.reactor.amounts[0] = new Decimal(0); }, style: { width: "40px", height: "30px", "min-height": "30px", "color": "white" } },
        62: { title: "MIN", display() { return ""; }, unlocked() { return hasMilestone("v", 4); }, canClick() { return player.v.reactor.amounts[1] && player.v.reactor.amounts[1].gt(0); }, onClick() { player.v.reactor.amounts[1] = new Decimal(0); }, style: { width: "40px", height: "30px", "min-height": "30px", "color": "white" } },
        64: { title: "MIN", display() { return ""; }, canClick() { return player.v.reactor.amounts[3].gt(0); }, onClick() { player.v.reactor.amounts[3] = new Decimal(0); }, style: { width: "40px", height: "30px", "min-height": "30px", "color": "white" } },

        11: {
            title: "<h1>EMBRACE VOID</h1>",
            display() {
                return `Descend into the Realm of Emptiness.<br><br><b>WARNING: You cannot choose the Plenum on this run once you confirm.</b><br><i>(However, you will eventually need to explore both paths for true progression.)</i>`
            },
            canClick() { return !player.v.chosen && !player.p.chosen && player.t4.points.gte("1e1020"); },
            unlocked() { return !player.v.chosen; }, // Hides the button once chosen
            onClick() {
                player.v.chosen = true;
                player.v.points = new Decimal(1);

                // --- FORCE BUY ALL LOWER UPGRADES & BUYABLES ---
                for (let l in layers) {
                    if (l === "v" || l === "p" || l === "a") continue;

                    // Auto-buy all upgrades
                    if (layers[l].upgrades) {
                        for (let id in layers[l].upgrades) {
                            if (id === "rows" || id === "cols") continue;
                            if (!player[l].upgrades.includes(Number(id)) && !player[l].upgrades.includes(String(id))) {
                                player[l].upgrades.push(Number(id));
                            }
                        }
                    }

                    // Auto-buy all buyables (up to their limit, or a large number if no limit)
                    if (layers[l].buyables) {
                        for (let id in layers[l].buyables) {
                            if (id === "rows" || id === "cols") continue;
                            let maxLimit = new Decimal(100); // Default to a reasonable max if none specified
                            if (layers[l].buyables[id].purchaseLimit !== undefined) {
                                maxLimit = new Decimal(layers[l].buyables[id].purchaseLimit);
                            }
                            setBuyableAmount(l, id, maxLimit);
                        }
                    }
                }
            },
            style: { width: "400px", minHeight: "150px", "background-color": "#220044", color: "white", border: "4px solid grey", "border-radius": "15px" }
        }
    }
})

// --- Global Modifiers ---
// Lock all lower nodes' purchases when Void is chosen
for (let l in layers) {
    if (typeof layers[l] !== "object") continue;
    if (l === "v" || l === "p" || l === "a") continue;
    if (layers[l].upgrades) {
        for (let id in layers[l].upgrades) {
            if (id === "rows" || id === "cols") continue;
            let upg = layers[l].upgrades[id];
            let oldCan = upg.canAfford;
            upg.canAfford = function () {
                if (!player) return false;
                if (player.v && player.v.chosen) return false;
                if (oldCan !== undefined) return oldCan.bind(this)();
                let cost = typeof this.cost === "function" ? this.cost() : this.cost;
                if (this.currencyInternalName) {
                    let res = this.currencyInternalName;
                    if (this.currencyLayer) return player[this.currencyLayer][res].gte(cost);
                    else return player[res].gte(cost);
                } else {
                    return player[this.layer].points.gte(cost);
                }
            }
        }
    }
    if (layers[l].buyables) {
        for (let id in layers[l].buyables) {
            if (id === "rows" || id === "cols") continue;
            let buy = layers[l].buyables[id];
            let oldCan = buy.canAfford;
            buy.canAfford = function () {
                if (!player) return false;
                if (player.v && player.v.chosen) return false;
                if (oldCan !== undefined) return oldCan.bind(this)();
                return player[this.layer].points.gte(this.cost());
            }
        }
    }

    // Override the main node's prestige/purchase button
    let oldCanReset = layers[l].canReset;
    layers[l].canReset = function () {
        if (!player) return false;
        if (player.v && player.v.chosen) return false;
        if (oldCanReset !== undefined) return oldCanReset.bind(this)();

        // TMT default canReset check
        let req = typeof this.requires === "function" ? this.requires() : this.requires;
        let baseAmt = undefined;
        if (this.baseAmount !== undefined) baseAmt = typeof this.baseAmount === "function" ? this.baseAmount() : player[this.baseResource];
        if (baseAmt === undefined || req === undefined) return false;
        return new Decimal(baseAmt).gte(req);
    }

    let oldPrestigeText = layers[l].prestigeButtonText;
    layers[l].prestigeButtonText = function () {
        if (!player) return "";
        if (player.v && player.v.chosen) return "<b style='color: red; font-size: 20px'>ANNIHILATED BY VOID</b>";
        if (oldPrestigeText !== undefined) return typeof oldPrestigeText === "function" ? oldPrestigeText.bind(this)() : oldPrestigeText;
        if (tmp[l] && tmp[l].type !== "none") return "Reset for <b>" + formatWhole(tmp[l].resetGain) + "</b> " + tmp[l].resource;
        return undefined;
    }
}
