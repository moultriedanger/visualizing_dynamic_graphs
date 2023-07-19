var alphaDecay = document.getElementById("alpha_decay_slider");
var alphaOutput = document.getElementById("alphaOutput")
alphaOutput.innerHTML = alphaDecay.value;

var forceCharge = document.getElementById("force_charge_slider");
var forceOutput = document.getElementById("chargeOutput")
forceOutput.innerHTML = forceCharge.value;

var forceLink = document.getElementById("force_link_slider");
var linkOutput = document.getElementById("linkOutput")
linkOutput.innerHTML = forceLink.value;

alphaDecay.oninput = function(){
    alphaOutput.innerHTML = this.value
}

forceCharge.oninput = function(){
    forceOutput.innerHTML = this.value
}

forceLink.oninput = function(){
    linkOutput.innerHTML = this.value
}

function registerValues(){
    var alphaDecay = document.getElementById("alpha_decay_slider").value;
    var forceCharge = document.getElementById("force_charge_slider").value;
    var forceLink = document.getElementById("force_link_slider").value;
    console.log('alpha decay =',alphaDecay)
    console.log('force charge =',forceCharge)
    console.log('force link =',forceLink)
}