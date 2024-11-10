export class ShaderProgram {
	constructor(name) {
		this.name = name;
	}

	use(gl) {
		gl.useProgram(this.prog);
		this.setupAttributes(gl);
		this.setupUniforms(gl);
	}

	setupAttributes(gl) {
		this.vertexAttrib = gl.getAttribLocation(this.prog, "vertex");
		this.normalAttrib = gl.getAttribLocation(this.prog, "normal");
	}

	setupUniforms(gl) {
		this.matrixUni = gl.getUniformLocation(this.prog, "matrix");
		this.normalMatrixUni = gl.getUniformLocation(this.prog, "normalMatrix");
		this.lightDirectionUni = gl.getUniformLocation(this.prog, "lightDirection");
		this.viewPositionUni = gl.getUniformLocation(this.prog, "viewPosition");
		this.ambientColorUni = gl.getUniformLocation(this.prog, "ambientColor");
		this.diffuseColorUni = gl.getUniformLocation(this.prog, "diffuseColor");
		this.specularColorUni = gl.getUniformLocation(this.prog, "specularColor");
		this.shininessUni = gl.getUniformLocation(this.prog, "shininess");
	}

	init(gl, vs, fs) {
		const vsh = this.compileShader(gl, gl.VERTEX_SHADER, vs);
		const fsh = this.compileShader(gl, gl.FRAGMENT_SHADER, fs);
		this.prog = this.createProgram(gl, vsh, fsh);
	}

	compileShader(gl, type, source) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error(
				`Shader compilation error: ${gl.getShaderInfoLog(shader)}`,
			);
		}
		return shader;
	}

	createProgram(gl, vsh, fsh) {
		const prog = gl.createProgram();
		gl.attachShader(prog, vsh);
		gl.attachShader(prog, fsh);
		gl.linkProgram(prog);
		if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
			throw new Error(`Program link error: ${gl.getProgramInfoLog(prog)}`);
		}
		return prog;
	}
}
