const canvas_size = [window.innerWidth, window.innerHeight];
let canvas_scale = 1;

let sandbox = new nWGL.main({ "width": canvas_size[0], "height": canvas_size[1], "disable_quad_vbo": true, "enableDepthTest": true, "autoClear": true });

//------------------------- Buffers -------------------------

let model = nWGL.loadOBJ("suzanne.obj");

let normals_buffer  = sandbox.addBuffer(
    {
        "data": model.normals
    },
    "normals_buffer");

let vertices_buffer  = sandbox.addBuffer(
    {
        "data": model.vertices
    },
    "vertices_buffer");

let indices_buffer2 = sandbox.addBuffer(
    {
        "target": "ELEMENT_ARRAY_BUFFER",
        "data": model.faces[0]
    },
    "indices_buffer2");

const total_model_verts = model.faces[0].length;
model = {}; // free up some memory

vertices_buffer.enableVertexAttribArray({"index": 0, "size": 3});
normals_buffer.enableVertexAttribArray({"index": 1, "size": 3});

indices_buffer2.bind();

//------------------------- Shaders -------------------------
sandbox.addShader("vert.glsl", "vertex_shader", true);
sandbox.addShader("display.glsl", "display_shader", false);

//------------------------- Display Program -------------------------
sandbox.addProgram(["vertex_shader", "display_shader"], "display");

var translation = [0, 0, -5];
var rotation = [0, 0, 0];
// var scale = [1, 1, 1];
var fieldOfViewRadians = nWGL.helper.degToRad(60);

// Compute the matrix
let aspect = sandbox.gl.canvas.clientWidth / sandbox.gl.canvas.clientHeight;
let zNear = 0.001;
let zFar = 500;
let matrix = nWGL.helper.perspective(fieldOfViewRadians, aspect, zNear, zFar);
matrix = nWGL.helper.translate(matrix, translation[0], translation[1], translation[2]);
if((rotation[0] + rotation[1] + rotation[2]) !== 0){
    matrix = nWGL.helper.xRotate(matrix, rotation[0]);
    matrix = nWGL.helper.yRotate(matrix, rotation[1]);
    matrix = nWGL.helper.zRotate(matrix, rotation[2]);
}
// matrix = nWGL.helper.scale(matrix, scale[0], scale[1], scale[2]);
sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);

//------------------------- Render Loop -------------------------
const realtime = false;
function render() {
    // sandbox.draw("LINE_LOOP", 6);
    sandbox.draw("TRIANGLES", total_model_verts, true);
    if(realtime)
        window.requestAnimationFrame(render);
};

let mouse_down = false;
let click_pos = null;
document.addEventListener('mousedown', function(event){;
    click_pos = [event.x, event.y];
    mouse_down = true;
});

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
}, false);

document.addEventListener('mousemove', function(event){
    if(!mouse_down) return;

    const translation_step = 0.005;
    const rotation_step = 0.08;

    let delta = [event.x - click_pos[0], event.y - click_pos[1]];
    click_pos = [event.x, event.y];

    // right click
    if(event.which === 3){
        temp1 = Math.sin(rotation[1])*delta[1]*translation_step;
        temp2 = Math.cos(rotation[1])*delta[1]*translation_step;

        translation[0] -= temp1;
        translation[2] += temp2;
        matrix = nWGL.helper.translate(matrix, -temp1, 0, temp2);
    } 
    // left click
    else if(event.which === 1) {
        temp1 = nWGL.helper.degToRad(delta[0]*rotation_step);
        // temp2 = nWGL.helper.degToRad(delta[1]*rotation_step);
    
        rotation[1] += temp1;
        // rotation[0] += temp2;
   
        matrix = nWGL.helper.translate(matrix, -translation[0], -translation[1], -translation[2]);
        matrix = nWGL.helper.yRotate(matrix, temp1);
        matrix = nWGL.helper.translate(matrix, translation[0], translation[1], translation[2]);
        // matrix = nWGL.helper.xRotate(matrix, temp2);
    }
    // middle mouse button
    else if(event.which === 2) {
        temp1 = Math.cos(rotation[1])*delta[0]*translation_step;
        temp2 = Math.sin(rotation[1])*delta[0]*translation_step;

        translation[0] += temp1;
        translation[2] += temp2;

        matrix = nWGL.helper.translate(matrix, temp1, 0, temp2);
    }

    sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
    if(!realtime) render();
});

document.addEventListener('mouseup', function(event){
    mouse_down = false;
});

document.addEventListener('keydown', function(event) {
    const translation_step = [1, 1, 1];
    const rotation_step = [
        nWGL.helper.degToRad(1),
        nWGL.helper.degToRad(1), 
        nWGL.helper.degToRad(1)
    ];
    
    // let temp = matrix;
    let temp1, temp2;

    switch(event.keyCode){
        // d - right
        case 68:
            temp1 = Math.cos(rotation[1])*translation_step[0];
            temp2 = Math.sin(rotation[1])*translation_step[0];

            translation[0] -= temp1;
            translation[2] -= temp2;
            matrix = nWGL.helper.translate(matrix, -temp1, 0, -temp2);
            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        // a - left
        case 65:
            temp1 = Math.cos(rotation[1])*translation_step[0];
            temp2 = Math.sin(rotation[1])*translation_step[0];

            translation[0] += temp1;
            translation[2] += temp2;
            matrix = nWGL.helper.translate(matrix, temp1, 0, temp2);
            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        // q - top
        case 81:
            translation[1] -= translation_step[1];
            matrix = nWGL.helper.translate(matrix, 0, -translation_step[1], 0);
            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        // r - bottom
        case 82:
            translation[1] += translation_step[1];
            matrix = nWGL.helper.translate(matrix, 0, translation_step[1], 0);
            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        // w - front
        case 87:
            temp1 = Math.sin(rotation[1])*translation_step[2];
            temp2 = Math.cos(rotation[1])*translation_step[2];

            translation[0] -= temp1;
            translation[2] += temp2;
            matrix = nWGL.helper.translate(matrix, -temp1, 0, temp2);
            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        // s - back
        case 83:
            temp1 = Math.sin(rotation[1])*translation_step[2];
            temp2 = Math.cos(rotation[1])*translation_step[2];

            translation[0] += temp1;
            translation[2] -= temp2;
            matrix = nWGL.helper.translate(matrix, temp1, 0, -temp2);
            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        // right arrow - Y local axis rotation 
        case 39:
            rotation[1] += rotation_step[1];
            
            matrix = nWGL.helper.translate(matrix, -translation[0], -translation[1], -translation[2]);
            matrix = nWGL.helper.yRotate(matrix, rotation_step[1]);
            matrix = nWGL.helper.translate(matrix, translation[0], translation[1], translation[2]);

            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        // left arrow - Y local axis rotation 
        case 37:
            rotation[1] -= rotation_step[1];

            matrix = nWGL.helper.translate(matrix, -translation[0], -translation[1], -translation[2]);
            matrix = nWGL.helper.yRotate(matrix, -rotation_step[1]);
            matrix = nWGL.helper.translate(matrix, translation[0], translation[1], translation[2]);

            sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
            if(!realtime) render();
            break;
        default:
            break;
    }
});

document.addEventListener('touchstart', function(event){
    click_pos = [];
    for(const touch of event.touches){
        click_pos.push(touch.clientX, touch.clientY);
    }

    mouse_down = true;
});

document.addEventListener('touchmove', function(event){
    if(!mouse_down) return;

    const translation_step = 0.005;
    const rotation_step = 0.08;

    const touches = event.touches.length;
    const posX =    event.touches[0].clientX;
    const posY =    event.touches[0].clientY;
    const pos2X =   event.touches[1] && event.touches[1].clientX;
    const pos2Y =   event.touches[1] && event.touches[1].clientY;

    if(touches === 1){
        temp1 = nWGL.helper.degToRad((posX - click_pos[0])*rotation_step);
        // temp2 = nWGL.helper.degToRad(delta[1]*rotation_step);
    
        rotation[1] += temp1;
        // rotation[0] += temp2;
    
        matrix = nWGL.helper.translate(matrix, -translation[0], -translation[1], -translation[2]);
        matrix = nWGL.helper.yRotate(matrix, temp1);
        matrix = nWGL.helper.translate(matrix, translation[0], translation[1], translation[2]);
        // matrix = nWGL.helper.xRotate(matrix, temp2);
    } else if(touches === 2){
        // touch_delta = Math.sqrt(Math.pow(posX-pos2X, 2) + Math.pow(posY-pos2Y, 2)*2)-touch_delta;
        
        let delta = 0;
        if(posX > pos2X){
            delta += click_pos[0]-posX;
            delta += pos2X-click_pos[2];
        } else {
            delta += click_pos[2]-pos2X;
            delta += posX-click_pos[0];
        }

        if(posY > pos2Y){
            delta += click_pos[1]-posY;
            delta += pos2Y-click_pos[3];
        } else {
            delta += click_pos[3]-pos2Y;
            delta += posY-click_pos[1];
        }
        delta *= 0.8;

        // pan
        if(Math.abs(posX-pos2X) < window.innerWidth*0.2 && 
            Math.abs(posY-pos2Y) < window.innerHeight*0.2){
        }
        // pinch
        else {
            temp1 = Math.sin(rotation[1])*delta*translation_step;
            temp2 = Math.cos(rotation[1])*delta*translation_step;

            translation[0] -= temp1;
            translation[2] += temp2;
            matrix = nWGL.helper.translate(matrix, -temp1, 0, temp2);
        }
    }

    click_pos = [posX, posY, pos2X, pos2Y];

    sandbox.programs["display"].addUniform("u_matrix", "Matrix4fv", matrix);
    if(!realtime) render();
});

render();