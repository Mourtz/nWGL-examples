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
/*
let offsets = sandbox.addBuffer(
    {
        "data": new Float32Array([
            0.0, 0.0, 0.0,
            3.0, 0.0, 0.0,
            -3.0, 0.0, 0.0
        ])
    },
    "offsets");
offsets.enableVertexAttribArray({"index": 2, "size": 3, "divisor": true});
*/
//------------------------- Shaders -------------------------
sandbox.addShader("vert.glsl", "vertex_shader", true);
sandbox.addShader("display.glsl", "display_shader", false);

//------------------------- Display Program -------------------------
sandbox.addProgram(["vertex_shader", "display_shader"], "display");

let model_matrix = new Float32Array(16);
model_matrix[0] = 1;
model_matrix[5] = 1;
model_matrix[10] = 1;
model_matrix[15] = 1;

let camera = new nWGL.camera(sandbox, {"position": [4, 3, 20]});

// matrix = nWGL.helper.scale(matrix, scale[0], scale[1], scale[2]);
sandbox.programs["display"].addUniform("u_model_matrix", "Matrix4fv", model_matrix);
sandbox.programs["display"].addUniform("u_view_matrix", "Matrix4fv", camera.view_matrix);
sandbox.programs["display"].addUniform("u_projection_matrix", "Matrix4fv", camera.projection_matrix);

//------------------------- Render Loop -------------------------
const realtime = false;
function render() {
    // sandbox.draw("LINE_LOOP", 6);
    sandbox.draw("TRIANGLES", total_model_verts, true, 27);
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

    let delta = [event.x - click_pos[0], event.y - click_pos[1]];
    click_pos = [event.x, event.y];

    // right click
    if(event.which === 3){
        camera.moveForward(0.1*delta[1]);
        sandbox.programs["display"].addUniform("u_view_matrix", "Matrix4fv", camera.view_matrix);
    } 
    // left click
    else if(event.which === 1) {
        camera.rotateLocalX(nWGL.helper.degToRad(delta[1]*0.1));
        camera.rotateLocalY(nWGL.helper.degToRad(delta[0]*0.1));
        sandbox.programs["display"].addUniform("u_view_matrix", "Matrix4fv", camera.view_matrix);
        
        // rotate models
        // model_matrix = nWGL.helper.yRotate(model_matrix, nWGL.helper.degToRad(delta[0]*0.1));
        // sandbox.programs["display"].addUniform("u_model_matrix", "Matrix4fv", model_matrix);
    }
    // middle mouse button
    else if(event.which === 2) {
        temp1 = delta[0]*0.005;
        temp2 = delta[1]*0.005;

        camera.pan(-temp1, temp2);
        sandbox.programs["display"].addUniform("u_view_matrix", "Matrix4fv", camera.view_matrix);
    }
    // sandbox.programs["display"].addUniform("u_projection_matrix", "Matrix4fv", camera.projection_matrix);
    // sandbox.programs["display"].addUniform("u_model_matrix", "Matrix4fv", model_matrix);
    if(!realtime) render();
});

document.addEventListener('mouseup', function(event){
    mouse_down = false;
});

/*
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
*/
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

    const touches = event.touches.length;
    const posX =    event.touches[0].clientX;
    const posY =    event.touches[0].clientY;
    const pos2X =   event.touches[1] && event.touches[1].clientX;
    const pos2Y =   event.touches[1] && event.touches[1].clientY;

    if(touches === 1){
        camera.rotateLocalX(nWGL.helper.degToRad((posY - click_pos[1])*0.1));
        camera.rotateLocalY(nWGL.helper.degToRad((posX - click_pos[0])*0.1));
        sandbox.programs["display"].addUniform("u_view_matrix", "Matrix4fv", camera.view_matrix);
    } else if(touches === 2){
        // touch_delta = Math.sqrt(Math.pow(posX-pos2X, 2) + Math.pow(posY-pos2Y, 2)*2)-touch_delta;

        // pan
        if(Math.abs(posX-pos2X) < window.innerWidth*0.2 && 
            Math.abs(posY-pos2Y) < window.innerHeight*0.2){
        }
        // pinch
        else {
            let delta = 0;
            // should probably move the origin to the center of the screen instead of doing that
            if(posX > pos2X){
                delta += click_pos[2]-pos2X;
                delta += posX-click_pos[0];
            } else {
                delta += click_pos[0]-posX;
                delta += pos2X-click_pos[2];
            }
            if(posY > pos2Y){
                delta += click_pos[3]-pos2Y;
                delta += posY-click_pos[1];
            } else {
                delta += click_pos[1]-posY;
                delta += pos2Y-click_pos[3];
            }

            camera.moveForward(-0.1*delta);
            sandbox.programs["display"].addUniform("u_view_matrix", "Matrix4fv", camera.view_matrix);
        }
    }

    click_pos = [posX, posY, pos2X, pos2Y];

    if(!realtime) render();
});

render();