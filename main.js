import { SurfaceModel } from "./geometry.js";

let gl; // The webgl context.
let surface; // A surface model
let program; // A shader program
let ball; // A SimpleRotator object that lets the user rotate the view by mouse.

function deg2rad(angle) {
	return (angle * Math.PI) / 180;
}

class ShaderProgram {
	constructor(name) {
		this.name = name;
	}

	use(gl) {
		gl.useProgram(this.prog);

		this.vertexAttrib = gl.getAttribLocation(this.prog, "vertex");
		this.matrixUni = gl.getUniformLocation(this.prog, "matrix");
		this.colorUni = gl.getUniformLocation(this.prog, "color");
	}

	init(gl, vs, fs) {
		const vsh = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vsh, vs);
		gl.compileShader(vsh);
		if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
			throw new Error(`Error in vertex shader: ${gl.getShaderInfoLog(vsh)}`);
		}

		const fsh = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fsh, fs);
		gl.compileShader(fsh);
		if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
			throw new Error(`Error in fragment shader: ${gl.getShaderInfoLog(fsh)}`);
		}

		const prog = gl.createProgram();
		gl.attachShader(prog, vsh);
		gl.attachShader(prog, fsh);
		gl.linkProgram(prog);
		if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
			throw new Error(`Link error in program: ${gl.getProgramInfoLog(prog)}`);
		}

		this.prog = prog;
	}
}

function initSurface() {
	surface = new SurfaceModel("Richmond's Minimal Surface");
	surface.createSurfaceData();
	surface.initBuffer(gl);
}
function initShaderProgram() {
	program = new ShaderProgram("Basic");
	program.init(gl, vertexShaderSource, fragmentShaderSource);
	program.use(gl);
}

function draw() {
	gl.clearColor(1, 1, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	/* Set the values of the projection transformation */
	const projection = m4.perspective(Math.PI / 8, 1, 8, 12);

	/* Get the view matrix from the SimpleRotator object.*/
	const modelView = ball.getViewMatrix();

	const rotateToPointZero = m4.axisRotation(
		[Math.SQRT1_2, Math.SQRT1_2, 0],
		0.7,
	);
	const translateToPointZero = m4.translation(0, 0, -10);

	const matAccum0 = m4.multiply(rotateToPointZero, modelView);
	const matAccum1 = m4.multiply(translateToPointZero, matAccum0);

	const modelViewProjection = m4.multiply(projection, matAccum1);
	gl.uniformMatrix4fv(program.matrixUni, false, modelViewProjection);

	/* setting color for all vertices */
	gl.uniform4fv(
		program.colorUni,
		[0.3803921569, 0.4470588235, 0.9529411765, 1],
	);

	surface.draw(gl, program);
}

function init() {
	const errorMessage = document.createElement("p");
	document.body.appendChild(errorMessage);
	try {
		const canvas = document.querySelector("canvas");
		gl = canvas.getContext("webgl");
		ball = new TrackballRotator(canvas, draw, 0);
		if (!gl) {
			throw "Browser does not support WebGL";
		}
	} catch (e) {
		errorMessage.innerHTML =
			"<p>Sorry, could not get a WebGL graphics context.</p>";
		return;
	}
	try {
		// initialize the WebGL graphics context
		initShaderProgram();
		initSurface();
		gl.enable(gl.DEPTH_TEST);
	} catch (e) {
		errorMessage.innerHTML = `<p>Sorry, could not initialize the WebGL graphics context: ${e}</p>`;
		return;
	}

	draw();
}

// add event listener on DOMContentLoaded event
document.addEventListener("DOMContentLoaded", init);

// handle u,v steppers values change
const uStepper = document.getElementById("u-stepper");
const vStepper = document.getElementById("v-stepper");
uStepper.addEventListener("change", init);
vStepper.addEventListener("change", init);

// update u,v steppers counter values on change
const updateCounter = (e) => {
	const input = e.target;
	if (!input) return;
	const container = input.parentNode;
	const counter = container.querySelector(".form-input__value");
	counter.textContent = input.value;
};
uStepper.addEventListener("change", updateCounter);
vStepper.addEventListener("change", updateCounter);
