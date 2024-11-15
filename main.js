import { SurfaceModel } from "./SurfaceModel.js";
import { ShaderProgram } from "./ShaderProgram.js";

let gl;
let surface;
let program;
let ball;

function getUVSteps() {
	return {
		u: Number.parseInt(document.getElementById("u-stepper").value, 10),
		v: Number.parseInt(document.getElementById("v-stepper").value, 10),
	};
}

function initSurface() {
	const { u, v } = getUVSteps();
	surface = new SurfaceModel("Richmond's Minimal Surface", u, v);
	surface.createSurfaceData();
	surface.initBuffer(gl);
}

function initShaderProgram() {
	program = new ShaderProgram("Basic");
	program.init(gl, vertexShaderSource, fragmentShaderSource);
	program.use(gl);
}

function setupUIControls() {
	const stepperTypes = ["u", "v"];

	// biome-ignore lint/complexity/noForEach: <explanation>
	stepperTypes.forEach((type) => {
		const stepper = document.getElementById(`${type}-stepper`);
		const counter = document.getElementById(`${type}-counter`);

		if (!stepper) {
			console.error(`Stepper element with id '${type}-stepper' not found`);
			return;
		}

		stepper.addEventListener("input", (e) => {
			if (counter) {
				counter.textContent = e.target.value;
			} else {
				console.warn(`Counter element with id '${type}-counter' not found`);
			}
			initSurface();
			draw();
		});
	});
}

function animateLight(time) {
	const radius = 10.0;
	const speed = 0.001;
	const x = radius * Math.cos(time * speed);
	const z = radius * Math.sin(time * speed);
	const y = 5.0;

	if (program) {
		gl.uniform3f(program.lightDirectionUni, x, y, z);
		draw();
	}
	requestAnimationFrame(animateLight);
}

function draw() {
	gl.clearColor(1, 1, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	const projection = m4.perspective(Math.PI / 8, 1, 0.1, 100);
	const modelView = ball.getViewMatrix();

	const rotateToPointZero = m4.axisRotation(
		[Math.SQRT1_2, Math.SQRT1_2, 0],
		0.7,
	);
	const translateToPointZero = m4.translation(0, 0, -10);

	const matAcc0 = m4.multiply(rotateToPointZero, modelView);
	const matAcc1 = m4.multiply(translateToPointZero, matAcc0);

	const modelViewProjection = m4.multiply(projection, matAcc1);
	gl.uniformMatrix4fv(program.matrixUni, false, modelViewProjection);

	const normalMatrix = m4.transpose(m4.inverse(matAcc1));
	gl.uniformMatrix4fv(program.normalMatrixUni, false, normalMatrix);

	gl.uniform3fv(program.viewPositionUni, [0.0, 0.0, 5.0]);
	gl.uniform3f(program.ambientColorUni, 0.2, 0.2, 0.2);
	gl.uniform3f(program.diffuseColorUni, 0.7, 0.7, 0.7);
	gl.uniform3f(program.specularColorUni, 1.0, 1.0, 1.0);
	gl.uniform1f(program.shininessUni, 32.0);

	surface.draw(gl, program);
}

function init() {
	try {
		const canvas = document.querySelector("canvas");
		gl = canvas.getContext("webgl");
		if (!gl) {
			throw "Browser does not support WebGL";
		}
		ball = new TrackballRotator(canvas, draw, 0);

		initShaderProgram();
		initSurface();
		gl.enable(gl.DEPTH_TEST);

		setupUIControls();
		draw();
		animateLight(0);
	} catch (e) {
		console.error(`Initialization error: ${e}`);
		const errorMessage = document.createElement("p");
		errorMessage.textContent = `Sorry, could not initialize the WebGL graphics context: ${e}`;
		document.body.appendChild(errorMessage);
	}
}

document.addEventListener("DOMContentLoaded", init);
