#version 300 es

precision highp float;

layout (location=0) in vec3 a_position;
layout (location=1) in vec3 a_normal;

uniform mat4 u_model_matrix, u_view_matrix, u_projection_matrix;
uniform float u_fudgeFactor;
// uniform float u_time;

flat out vec3 v_normal;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_projection_matrix * u_view_matrix * u_model_matrix * vec4(a_position, 1.0) ;
  v_normal = a_normal;
}