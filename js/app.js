var stats, scene, renderer, composer;
var camera, cameraControls;

var cube = new THREE.Object3D();

var cameraDistance = 15;

var partsInCubeFace = 3;
var cubePartSize = 1.5;
var cubePartDepth = 0.5;
var colors = {
	'white' : {
		'hex' : 0xffffff,
		'count' : 9
	},
	'black' : {
		'hex' : 0x000000,
		'count' : 9
	},
	'red'   : {
		'hex' : 0xff0000,
		'count' : 9
	},
	'green' : {
		'hex' : 0x00ff00,
		'count' : 9
	},
	'blue'  : {
		'hex' : 0x0000ff,
		'count' : 9
	},
	'yellow': {
		'hex' : 0xffff00,
		'count' : 9
	}
};

var cubesIDs = [];

var rotations = {
	'LTR'   : {
		'CW' : new THREE.Euler(Math.PI / 2, 0, 0, 'XYZ'),
		'CCW' : new THREE.Euler(-Math.PI / 2, 0, 0, 'XYZ')
	},
	'TTB'   : {
		'CW' : new THREE.Euler(0, 0, Math.PI / 2, 'XYZ'),
		'CCW' : new THREE.Euler(0, 0, -Math.PI / 2, 'XYZ')
	},
	'FTH' : {
		'CW' : new THREE.Euler(0, Math.PI / 2, 0, 'XYZ'),
		'CCW' : new THREE.Euler(0, -Math.PI / 2, 0, 'XYZ')
	}
};

var groupingFunctions = {
	'TTB' : function(layer) {
		var groupedCubes = new THREE.Object3D();
		for (var i = 0; i < cubesIDs.length; i++) {
			for (var j = 0; j < cubesIDs[i].length; j++) {
				groupedCubes.add(
					cube.getObjectById(
						cubesIDs[i][j][layer]
					)
				);
			}
		}
		return groupedCubes;
	},
	'LTR' : function(layer) {
		var groupedCubes = new THREE.Object3D();
		for (var i = 0; i < cubesIDs[layer].length; i++) {
			for (var j = 0; j < cubesIDs[layer][i].length; j++) {
				groupedCubes.add(
					cube.getObjectById(
						cubesIDs[layer][i][j]
					)
				);
			}
		}

		return groupedCubes;
	},
	'FTH' : function(layer) {
		var groupedCubes = new THREE.Object3D();
		for (var i = 0; i < cubesIDs.length; i++) {
			for (var j = 0; j < cubesIDs[i][layer].length; j++) {
				groupedCubes.add(
					cube.getObjectById(
						cubesIDs[i][layer][j]
					)
				);
			}
		}

		return groupedCubes;
	}
}

function pickRandomProperty(obj) {
    var result;
    var count = 0;
    for (var prop in obj)
        if (Math.random() < 1 / ++count)
           result = prop;
    return result;
};

if( !init() )	animate();

function addCubePart(size, color, rotation, position) {
	if (rotation === undefined) {
		rotation = new THREE.Euler(0, 0, 0, 'XYZ');
	}
	if (position === undefined) {
		position = new THREE.Vector3(0, 0, 0);
	}
	var geometry = new THREE.BoxGeometry(size, size, size);
	for ( var i = 0; i < geometry.faces.length; i += 2) {
	    geometry.faces[i].color.setHex(color.hex);
	    geometry.faces[i + 1].color.setHex(color.hex);
	}

	var material = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } );

	var cube = new THREE.Mesh( geometry, material );
	var box = new THREE.BoxHelper( cube );

	var obj = new THREE.Object3D();
	obj.add(cube);
	obj.add(box);

	obj.position.copy(position);
	obj.rotation.copy(rotation);

	return obj;
};

function getNewColor() {
	var color = colors[pickRandomProperty(colors)];
	while (color.count < 1) {
		color = colors[pickRandomProperty(colors)];
	}
	colors[pickRandomProperty(colors)].count--;
	return color;
};

function createCube() {
	var cubePart;
	// Create a face of the cube
	for (var i = 0; i < partsInCubeFace; i++) {
		cubesIDs.push([]);
		for (var j = 0; j < partsInCubeFace; j++) {
			cubesIDs[i].push([]);
			for (var k = 0; k < partsInCubeFace; k++) {
				cubePart = 	addCubePart(
					cubePartSize,
					getNewColor(),
					undefined,
					new THREE.Vector3(
						(i - 1) * cubePartSize,
						(j - 1) * cubePartSize,
						(k - 1) * cubePartSize
					)
				);
				cubesIDs[i][j].push(cubePart.id);
				cube.add(cubePart);
			}
		}
	}

	cube.rotation.copy(new THREE.Euler(Math.PI / 2, 0, 0, 'XYZ'));
}

function rotateCube(rotation, direction, layer) {
	var groupedCubes = groupingFunctions[rotation](layer);

	groupedCubes.rotation.copy(rotations[rotation][direction]);
	groupedCubes.updateMatrixWorld();
	var child;
	while (groupedCubes.children.length > 0) {
		child = groupedCubes.children[0];
		cube.add(
			groupedCubes.children[0]
		);
		child.position.copy((new THREE.Vector3()).setFromMatrixPosition(child.matrixWorld));
	}
}

function addCubeFace(position, rotation) {
	if (rotation === undefined) {
		rotation = new THREE.Euler(0, 0, 0, 'XYZ');
	}
	if (position === undefined) {
		position = new THREE.Vector3(0, 0, 0);
	}

	var face = new THREE.Object3D();
	// Create a face of the cube
	for (var i = 0; i < partsInCubeFace; i++) {
		for (var j = 0; j < partsInCubeFace; j++) {
			face.add(
				addCubePart(
					cubePartSize,
					pickRandomProperty(colors),
					undefined,
					new THREE.Vector3(-1.5 + j * cubePartSize, -1.5 + i * cubePartSize, 0)
				)
			);
		}
	}

	face.position.copy(position);
	face.rotation.copy(rotation);

	return face;
}

// init the scene
function init(){

	if( Detector.webgl ){
		renderer = new THREE.WebGLRenderer({
			antialias		: true,	// to get smoother output
			preserveDrawingBuffer	: true	// to allow screenshot
		});
		renderer.setClearColor( 0xbbbbbb );
	}else{
		renderer	= new THREE.CanvasRenderer();
	}
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.getElementById('container').appendChild(renderer.domElement);

	// add Stats.js - https://github.com/mrdoob/stats.js
	stats = new Stats();
	stats.domElement.style.position	= 'absolute';
	stats.domElement.style.bottom	= '0px';
	document.body.appendChild( stats.domElement );

	// create a scene
	scene = new THREE.Scene();

	// put a camera in the scene
	camera	= new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.set(0, 0, cameraDistance);
	scene.add(camera);

	// create a camera contol
	cameraControls	= new THREE.TrackballControls( camera )

	// transparently support window resize
	THREEx.WindowResize.bind(renderer, camera);
	// allow 'p' to make screenshot
	THREEx.Screenshot.bindKey(renderer);
	// allow 'f' to go fullscreen where this feature is supported
	if( THREEx.FullScreen.available() ){
		THREEx.FullScreen.bindKey();		
		document.getElementById('inlineDoc').innerHTML	+= "- <i>f</i> for fullscreen";
	}

	// here you add your objects
	// - you will most likely replace this part by your own
	var light	= new THREE.AmbientLight( Math.random() * 0xffffff );
	scene.add( light );
	var light	= new THREE.DirectionalLight( Math.random() * 0xffffff );
	light.position.set( Math.random(), Math.random(), Math.random() ).normalize();
	scene.add( light );
	var light	= new THREE.DirectionalLight( Math.random() * 0xffffff );
	light.position.set( Math.random(), Math.random(), Math.random() ).normalize();
	scene.add( light );
	var light	= new THREE.PointLight( Math.random() * 0xffffff );
	light.position.set( Math.random()-0.5, Math.random()-0.5, Math.random()-0.5 )
				.normalize().multiplyScalar(1.2);
	scene.add( light );
	var light	= new THREE.PointLight( Math.random() * 0xffffff );
	light.position.set( Math.random()-0.5, Math.random()-0.5, Math.random()-0.5 )
				.normalize().multiplyScalar(1.2);
	scene.add( light );


	createCube();
	scene.add(
		cube
	);

}


function handleKeyUp(event) {
	window.keyEvent = {
		pressed : true,
	};
	switch (event.keyCode) {
		case 81: // 'Q'
		case 87: // 'W'
			window.keyEvent.rotation = 'TTB';
			window.keyEvent.direction = event.keyCode === 81 ? 'CW' : 'CCW';
			window.keyEvent.layer = 0;
			break;
		case 65: // 'A'
		case 83: // 'S'
			window.keyEvent.rotation = 'TTB';
			window.keyEvent.direction = event.keyCode === 65 ? 'CW' : 'CCW';
			window.keyEvent.layer = 1;
			break;
		case 88: //'X'
		case 90: //'Z'
			window.keyEvent.rotation = 'TTB';
			window.keyEvent.direction = event.keyCode === 90 ? 'CW' : 'CCW';
			window.keyEvent.layer = 2;
			break;

		default:
			window.keyEvent.pressed = false;
	}
}

window.addEventListener('keyup', handleKeyUp, false);

// animation loop
function animate() {

	// loop on request animation loop
	// - it has to be at the begining of the function
	// - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
	requestAnimationFrame( animate );

	if (window.keyEvent === undefined) {
		window.keyEvent = {};
	}

	if (window.keyEvent.pressed) {
		window.keyEvent.pressed = false;
		rotateCube(window.keyEvent.rotation, window.keyEvent.direction, window.keyEvent.layer);
	}

	// do the render
	render();

	// update stats
	stats.update();
}

// render the scene
function render() {
	// variable which is increase by Math.PI every seconds - usefull for animation
	var PIseconds	= Date.now() * Math.PI;

	// update camera controls
	cameraControls.update();


	// actually render the scene
	renderer.render( scene, camera );
}