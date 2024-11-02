// geometry.js
class SurfaceModel {
	constructor(name) {
		this.name = name;
		this.uLines = [];
		this.vLines = [];
		this.indices = [];
		this.vertexBuffer = null;
		this.indexBuffer = null;
	}

	getUVSteps() {
		const uStepper = document.getElementById("u-stepper");
		const vStepper = document.getElementById("v-stepper");

		return {
			u: uStepper.value,
			v: vStepper.value,
		};
	}

	createSurfaceData() {
		const uMin = -1;
		const uMax = 1;
		const vMin = 0.2;
		const vMax = 1;
		const { u, v } = this.getUVSteps();
		const uSteps = u || 50;
		const vSteps = v || 50;

		const du = (uMax - uMin) / uSteps;
		const dv = (vMax - vMin) / vSteps;

		// Generate U and V lines
		for (let uIndex = 0; uIndex <= uSteps; uIndex++) {
			const u = uMin + uIndex * du;
			const uLine = [];
			for (let vIndex = 0; vIndex <= vSteps; vIndex++) {
				const v = vMin + vIndex * dv;

				// Parametric equation for Richmond's Minimal Surface
				const x =
					(-3 * u - u ** 5 + 2 * u ** 3 * v ** 2 + 3 * u * v ** 4) /
					(6 * (u ** 2 + v ** 2));
				const y =
					(-3 * v - 3 * u ** 4 * v - 2 * u ** 2 * v ** 3 + v ** 5) /
					(6 * (u ** 2 + v ** 2));
				const z = u;

				uLine.push([x, y, z]);
			}
			this.uLines.push(uLine);
		}

		// Generate V lines by transposing the uLines array
		for (let vIndex = 0; vIndex <= vSteps; vIndex++) {
			const vLine = [];
			for (let uIndex = 0; uIndex <= uSteps; uIndex++) {
				vLine.push(this.uLines[uIndex][vIndex]);
			}
			this.vLines.push(vLine);
		}

		// Generate indices for the triangles
		const indices = [];
		for (let uIndex = 0; uIndex < this.uLines.length - 1; uIndex++) {
			for (let vIndex = 0; vIndex < this.uLines[uIndex].length - 1; vIndex++) {
				const topLeft = uIndex * this.uLines[uIndex].length + vIndex;
				const topRight = topLeft + 1;
				const bottomLeft = (uIndex + 1) * this.uLines[uIndex].length + vIndex;
				const bottomRight = bottomLeft + 1;

				indices.push(topLeft, bottomLeft, topRight);
				indices.push(bottomLeft, bottomRight, topRight);
			}
		}
		this.indices = indices;
	}

	getVertices() {
		const vertices = [];
		// Add U lines
		for (const uLine of this.uLines) {
			for (const point of uLine) {
				vertices.push(...point);
			}
		}
		// Add V lines
		for (const vLine of this.vLines) {
			for (const point of vLine) {
				vertices.push(...point);
			}
		}
		return vertices;
	}

	initBuffer(gl) {
		// Create a VBO for the vertices
		this.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(this.getVertices()),
			gl.STATIC_DRAW,
		);

		// Create a VBO for the indices
		this.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(
			gl.ELEMENT_ARRAY_BUFFER,
			new Uint16Array(this.indices),
			gl.STATIC_DRAW,
		);
	}

	draw(gl, program) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(program.vertexAttrib, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(program.vertexAttrib);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
	}
}

export { SurfaceModel };
