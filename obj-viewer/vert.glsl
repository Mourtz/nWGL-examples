#version 300 es

precision highp float;

layout (location=0) in vec3 a_position;
layout (location=1) in vec3 a_normal;

uniform mat4 u_matrix;
uniform float u_fudgeFactor;

flat out vec3 v_normal;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * vec4(a_position, 1.0);
  v_normal = a_normal;
}