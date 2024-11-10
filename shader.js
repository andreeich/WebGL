const vertexShaderSource = `
    attribute vec3 vertex;
    attribute vec3 normal;
    uniform mat4 matrix;
    uniform mat4 normalMatrix;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
        vec4 position = matrix * vec4(vertex, 1.0);
        gl_Position = position;
        vPosition = position.xyz;
        vNormal = normalize((normalMatrix * vec4(normal, 0.0)).xyz);
    }
`;

const fragmentShaderSource = `
    precision mediump float;

    varying vec3 vNormal;
    varying vec3 vPosition;

    uniform vec3 lightDirection;
    uniform vec3 viewPosition;
    uniform vec3 ambientColor;
    uniform vec3 diffuseColor;
    uniform vec3 specularColor;
    uniform float shininess;

    void main() {
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(lightDirection - vPosition);
        vec3 viewDir = normalize(viewPosition - vPosition);

        // Ambient
        vec3 ambient = ambientColor;

        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * diffuseColor;

        // Specular
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
        vec3 specular = spec * specularColor;

        vec3 result = ambient + diffuse + specular;
        gl_FragColor = vec4(result, 1.0);
    }
`;
