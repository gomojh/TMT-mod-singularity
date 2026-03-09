let modInfo = {
	name: "the singularity tree",
	id: "the_singularity_tree_happyapple",
	author: "happyapple",
	pointsName: "mana",
	modFiles: ["layers.js", "tree.js"],

	discordName: "",
	discordLink: "",
	initialStartPoints: new Decimal(0), // Used for hard resets and new players
	offlineLimit: 1,  // In hours
}

// Set your version in num and name
let VERSION = {
	num: "0.1",
	name: "path to the void",
}

let changelog = `<h1>Changelog:</h1><br>
	<h3>v0.0</h3><br>
		- Added things.<br>
		- Added stuff.`

let winText = `Congratulations! You have reached the end and beaten this game, but for now...`

// If you add new functions anywhere inside of a layer, and those functions have an effect when called, add them here.
// (The ones here are examples, all official functions are already taken care of)
var doNotCallTheseFunctionsEveryTick = ["blowUpEverything"]

function getStartPoints() {
	return new Decimal(modInfo.initialStartPoints)
}

// Determines if it should show points/sec
function canGenPoints() {
	return true
}

// Calculate points/sec!
function getPointGen() {
	if (!canGenPoints())
		return new Decimal(0)

	let gain = new Decimal(1)
	if (hasUpgrade("e", 13)) gain = gain.add(5)

	if (hasUpgrade("e", 11)) gain = gain.times(2)
	if (hasUpgrade("e", 12)) gain = gain.times(upgradeEffect("e", 12))
	if (hasUpgrade("e", 21)) gain = gain.times(upgradeEffect("e", 21))

	if (hasUpgrade("e", 31)) gain = gain.times(5)
	if (hasUpgrade("e", 33)) gain = gain.times(10)

	// Buyables
	if (getBuyableAmount("e", 11).gt(0)) gain = gain.times(buyableEffect("e", 11))

	// Elemental Upgrades & Milestones
	if (hasMilestone("ee", 0)) gain = gain.times(2)
	if (hasUpgrade("ee", 11)) gain = gain.times(upgradeEffect("ee", 11))

	// The Four Elements (Tier 3) secondary bonus (^0.25 to Mana)
	let fourElementsMult = new Decimal(1);
	if (player.f && player.f.unlocked) fourElementsMult = fourElementsMult.times(layers.f.effect());
	if (player.w && player.w.unlocked) fourElementsMult = fourElementsMult.times(layers.w.effect());
	if (player.ea && player.ea.unlocked) fourElementsMult = fourElementsMult.times(layers.ea.effect());
	if (player.wi && player.wi.unlocked) fourElementsMult = fourElementsMult.times(layers.wi.effect());
	gain = gain.times(fourElementsMult.pow(0.25));

	return gain
}

// You can add non-layer related variables that should to into "player" and be saved here, along with default values
function addedPlayerData() {
	return {
	}
}

// Display extra things at the top of the page
var displayThings = [
	function () {
		let cap = new Decimal(1e25);
		if (typeof layers !== "undefined" && layers.e && layers.e.getCap) cap = layers.e.getCap();
		if (player && player.e && player.e.points.gte(cap)) {
			return `<h3 style='color: #ff4d4d; text-shadow: 0 0 10px #ff4d4d'>⚠️ MAXIMUM ESSENCE REACHED (${formatWhole(cap)}). Further gain is capped. ⚠️</h3>`;
		}
		return "";
	}
]

// Determines when the game "ends"
function isEndgame() {
	return player.points.gte(new Decimal("e280000000"))
}



// Less important things beyond this point!

// Style for the background, can be a function
var backgroundStyle = {

}

// You can change this if you have things that can be messed up by long tick lengths
function maxTickLength() {
	return (3600) // Default is 1 hour which is just arbitrarily large
}

// Use this if you need to undo inflation from an older version. If the version is older than the version that fixed the issue,
// you can cap their current resources with this.
function fixOldSave(oldVersion) {
	const requiredLayers = ["e", "ee", "f", "w", "ea", "wi", "t4", "ha", "a", "p", "v"];
	requiredLayers.forEach(l => {
		if (player[l] === undefined) {
			player[l] = layers[l].startData ? layers[l].startData() : { points: new Decimal(0), unlocked: false };
			if (layers[l].upgrades && !player[l].upgrades) player[l].upgrades = [];
			if (layers[l].milestones && !player[l].milestones) player[l].milestones = [];
			if (layers[l].buyables && !player[l].buyables) player[l].buyables = {};
		}
	});
}