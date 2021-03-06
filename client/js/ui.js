/* jslint browser: true */

/***********************************************************
    Fields.
************************************************************/

var _icon_class = {
            plus: "fs-plus-icon"
        },
    
    _selected_slice,
    
    _brush_helper_timeout,
    
    _midi_out_editor,
    
    _midi_out_dialog_id = "fs_midi_out_dialog",
    _midi_out_dialog,
    
    _paint_dialog_id = "fs_paint_dialog",
    _paint_dialog,
    
    _settings_dialog_id = "fs_settings_dialog",
    _settings_dialog,
    
    _midi_settings_dialog_id = "fs_midi_settings_dialog",
    _midi_settings_dialog,
    
    _help_dialog_id = "fs_help_dialog",
    _help_dialog,
    
    _analysis_dialog_id = "fs_analysis_dialog",
    _analysis_dialog,
    
    _record_dialog_id = "fs_record_dialog",
    _record_dialog,
    
    _outline_dialog_id = "fs_outline_dialog",
    _outline_dialog,

    _slices_dialog_id = "fs_slices_dialog",
    _slices_dialog,

    _slices_dialog_timeout = null,
    
    _import_dialog_id = "fs_import_dialog",
    _import_dialog,
    
    _quickstart_dialog_id = "fs_quickstart",
    _quickstart_dialog,
    
    _fas_dialog_id = "fs_fas_dialog",
    _fas_dialog,

    _fas_synth_params_dialog_id = "fs_fas_synth_params_dialog",
    _fas_synth_params_dialog,

    _fx_dialog_id = "fs_fx_dialog",
    _fx_dialog,
    
    _fas_chn_notify_timeout,
    
    _wui_main_toolbar,

    _collapsible_id = 0,
    
    _send_slices_settings_timeout,
    _add_slice_timeout,
    _remove_slice_timeout,

    _synthesis_types = ["Additive", "Spectral", "Granular", "PM/FM", "Subtractive", "Karplus", "Wavetable"],
    _synthesis_enabled = [1, 0, 1, 1, 1, 1, 0],
    _synthesis_params = [0, 0, 3, 0, 0, 0, 0],
    
    _fas_content_list = [];

/***********************************************************
    Functions.
************************************************************/

var _togglePlay = function (toggle_ev) {
    if (toggle_ev.state) {
        _pause();
    } else {
        _play();
    }
};

var _showHelpDialog = function () {
    WUI_Dialog.open(_help_dialog);
};

var _showSettingsDialog = function () {
    WUI_Dialog.open(_settings_dialog);
};

var _showMIDISettingsDialog = function () {
    WUI_Dialog.open(_midi_settings_dialog);
};

var _showMIDIOutDialog = function () {
    WUI_Dialog.open(_midi_out_dialog);
};

var _fasNotifyChnInfos = function () {
    _fasNotify(_FAS_CHN_INFOS, _chn_settings);  
};

var _onChangeChannelSettings = function (channel, channel_data_index) {
    return function (value) {
        _chn_settings[channel][channel_data_index] = value;

        _local_session_settings.chn_settings[channel] = _chn_settings[channel];
        _saveLocalSessionSettings();

        clearTimeout(_fas_chn_notify_timeout);
        _fas_chn_notify_timeout = setTimeout(_fasNotifyChnInfos, 2000);
    };
};

var _toggleCollapse = function (element) {
    return function (ev) {
        var elem = ev.target.ownerDocument.getElementById(element.id);

        elem.classList.toggle("fs-collapsible");
        elem.classList.toggle("fs-collapsed");

        ev.stopPropagation();
    };
};

var _applyCollapsible = function (element, bind_to, collapsed) {
    element.id = "fs_collapsible_" + _collapsible_id;

    element.classList.add("fs-collapsible");

    if (collapsed) {
        element.classList.add("fs-collapsed");
    }

    if (element.classList.contains("fs-collapsed")) {
        element.classList.toggle("fs-collapsible");
    }    

    bind_to.addEventListener("click", _toggleCollapse(element));

    bind_to.id = "fs_collapsible_target_" + _collapsible_id;

    if (element !== bind_to) {
        element.addEventListener("click", function (ev) {
            var elem = ev.target.ownerDocument.getElementById(element.id);
            var bto = ev.target.ownerDocument.getElementById(bind_to.id);

            if (elem.classList.contains("fs-collapsed")) {
                bto.dispatchEvent(new UIEvent('click'));
                bind_to.dispatchEvent(new UIEvent('click'));
            }

            ev.stopPropagation();
        });
    }

    _collapsible_id += 1;
};

var _updateSlicesDialog = function () {
    var slices_dialog_ul = document.createElement("ul");
    slices_dialog_ul.classList.add("fs-slices-list");
    var slices_dialog_content = document.getElementById(_slices_dialog_id).lastElementChild;
    slices_dialog_content.innerHTML = "";

    var i = 0;
    for (i = 0; i < _play_position_markers.length; i += 1) {
        var play_position_marker = _play_position_markers[i];

        var slices_dialog_li = document.createElement("li");

        var li_content = [
            "<span>CHN " + play_position_marker.output_channel + "</span>"];

        if (play_position_marker.mute) {
            //li_content.push("<span>MUTED</span>");
            slices_dialog_li.style = "text-decoration: line-through";
        }
        if (play_position_marker.audio_out) {
            li_content.push("<span>AUDIO OUT</span>");
        }
        if (play_position_marker.osc_out) {
            li_content.push("<span>OSC OUT</span>");
        }
        if (play_position_marker.midi_out.enabled) {
            li_content.push("<span>MIDI OUT</span>");
        }

        slices_dialog_li.addEventListener("click", _openSliceSettingsDialogFn(play_position_marker));
        slices_dialog_li.addEventListener("contextmenu", _showSliceSettingsMenuFn(play_position_marker.element));
        
        slices_dialog_li.innerHTML = play_position_marker.id + ": " + li_content.join(' - ');

        slices_dialog_ul.appendChild(slices_dialog_li);
    }

    slices_dialog_content.appendChild(slices_dialog_ul);

    _slices_dialog_timeout = setTimeout(_updateSlicesDialog, 3000);
};

var _openedSlicesDialog = function () {
    _updateSlicesDialog();

    _slices_dialog_timeout = setTimeout(_updateSlicesDialog, 3000);
};

var _closedSlicesDialog = function () {
    clearTimeout(_slices_dialog_timeout);
};

var _createFxSettingsContent = function () {

};

var _openSynthParameters = function () {
    WUI_Dialog.open(_fas_synth_params_dialog);
};

var _createSynthParametersContent = function () {
    var dialog_div = document.getElementById(_fas_synth_params_dialog).lastElementChild,
    
        detached_dialog = WUI_Dialog.getDetachedDialog(_fas_synth_params_dialog),    
    
        synth_type = 0,    
        chn_fieldset,
        chn_legend,

        chn_settings,

        chn_genv_type_label,
        chn_genv_type_select,
        chn_genv_option,
        chn_genv_options = ["sine", "hann", "hamming", "tukey", "gaussian", "confined gaussian", "trapezoidal", "blackman", "blackman harris", "parzen", "nutall", "flattop", "kaiser"],
        
        chn_gden_input,
        chn_gmin_size_input,
        chn_gmax_size_input,

        gmin = 0.01,
        gmax = 0.1,
        gden = 0.00001,

        i = 0, j = 0;
    
    if (detached_dialog) {
        dialog_div = detached_dialog.document.body;
    }
    
    for (i = 0; i < _fas_content_list.length; i += 1) {
        WUI_RangeSlider.destroy(_fas_content_list[i]);
    }

    _fas_content_list = [];

    dialog_div.innerHTML = "";

    for (j = 0; j < _output_channels; j += 1) {
        chn_settings = _chn_settings[j];

        synth_type = _chn_settings[j][0];

        if (_synthesis_params[synth_type] <= 0) {
            continue;
        }

        chn_fieldset = document.createElement("fieldset");
        chn_legend = document.createElement("legend");

        chn_fieldset.className = "fs-fieldset";
        
        chn_legend.innerHTML = "Chn " + j + " / " + _synthesis_types[synth_type];

        chn_fieldset.appendChild(chn_legend);

        // granular parameters
        if (_synthesis_types[synth_type] === "Granular") {
            chn_gmin_size_input = document.createElement("div");
            chn_gmin_size_input.id = "fs_chn_" + j + "_gmin";
            chn_gmax_size_input = document.createElement("div");
            chn_gmax_size_input.id = "fs_chn_" + j + "_gmax";
            chn_gden_input = document.createElement("div");
            chn_gden_input.id = "fs_chn_" + j + "_gden";


            chn_genv_type_label = document.createElement("label");
            chn_genv_type_select = document.createElement("select");
            
            for (i = 0; i < chn_genv_options.length; i += 1) {
                chn_genv_option = document.createElement("option");
                chn_genv_option.innerHTML = chn_genv_options[i];
                
                chn_genv_type_select.appendChild(chn_genv_option);
            }
            
            chn_genv_type_label.classList.add("fs-input-label");
            //chn_genv_type_label.style.display = "none";
            chn_genv_type_label.innerHTML = "Granular env: &nbsp;";
            chn_genv_type_label.htmlFor = "fs_chn_" + j + "_genv_type_settings";
            
            chn_genv_type_select.classList.add("fs-btn");
            chn_genv_type_select.style = "margin-top: 4px";
            //chn_genv_type_select.style.display = "none";
            chn_genv_type_select.dataset.chnId = j;
            chn_genv_type_select.id = chn_genv_type_label.htmlFor;

            chn_genv_type_select.childNodes[chn_settings[1]].selected = true;

            gmin = chn_settings[2];
            gmax = chn_settings[3];
            gden = chn_settings[4];

            chn_genv_type_select.addEventListener("change", function() {
                var j = parseInt(this.dataset.chnId, 10),
                    value = parseInt(this.selectedIndex, 10);

                _chn_settings[j][1] = value;

                _local_session_settings.chn_settings[j] = _chn_settings[j];
                _saveLocalSessionSettings();
            
                clearTimeout(_fas_chn_notify_timeout);
                _fas_chn_notify_timeout = setTimeout(_fasNotifyChnInfos, 2000);
            });

            chn_fieldset.appendChild(chn_genv_type_label);
            chn_fieldset.appendChild(chn_genv_type_select);
            chn_fieldset.appendChild(chn_gmin_size_input);
            chn_fieldset.appendChild(chn_gmax_size_input);
            chn_fieldset.appendChild(chn_gden_input);

            _fas_content_list.push(WUI_RangeSlider.create(chn_gmin_size_input, {
                width: 120,
                height: 8,
    
                min: 0.0,
                max: 1.0,
    
                bar: false,
    
                step: 0.0001,
                scroll_step: 0.01,
    
                default_value: gmin,
                value: gmin,
    
                decimals: 4,

                midi: true,
                
                title: "Min. grain length",
    
                title_min_width: 140,
                value_min_width: 88,
    
                on_change: _onChangeChannelSettings(j, 2)
            }));
            
            _fas_content_list.push(WUI_RangeSlider.create(chn_gmax_size_input, {
                width: 120,
                height: 8,
    
                min: 0.0,
                max: 1.0,
    
                bar: false,
    
                step: 0.0001,
                scroll_step: 0.01,
    
                default_value: gmax,
                value: gmax,

                midi: true,
                
                decimals: 4,
    
                title: "Max. grain length",
    
                title_min_width: 140,
                value_min_width: 88,
    
                on_change: _onChangeChannelSettings(j, 3)
            }));
    
            _fas_content_list.push(WUI_RangeSlider.create(chn_gden_input, {
                width: 120,
                height: 8,
    
                min: 0.0,
                max: 1.0,
    
                bar: false,
    
                step: 0.00001,
                scroll_step: 0.01,
    
                default_value: gden,
                value: gden,

                midi: true,
                
                decimals: 5,
    
                title: "Spread",
    
                title_min_width: 140,
                value_min_width: 88,
    
                on_change: _onChangeChannelSettings(j, 4)
            }));

            chn_genv_type_select.dispatchEvent(new UIEvent('change'));
        }

        _applyCollapsible(chn_fieldset, chn_legend);

        dialog_div.appendChild(chn_fieldset);
    }

    if (dialog_div.innerHTML.length <= 0) {
        dialog_div.innerHTML = '<div style="padding: 8px; color: #ffffff">No synthesis parameters.</div>';
    }
};

var _createFasSettingsContent = function () {
    var dialog_div = document.getElementById(_fas_dialog).lastElementChild,
        detached_dialog = WUI_Dialog.getDetachedDialog(_fas_dialog),

        load_samples_btn = document.createElement("button"),
        open_synth_params_btn = document.createElement("button"),
        
        synthesis_matrix_fieldset = document.createElement("fieldset"),
        fx_matrix_fieldset = document.createElement("fieldset"),
        actions_fieldset = document.createElement("fieldset"),

        fx_matrix_fx_fieldset = document.createElement("fieldset"),
        fx_matrix_chn_fieldset = document.createElement("fieldset"),

        synthesis_matrix_table = document.createElement("table"),
        fx_matrix_table = document.createElement("table"),
        
        synthesis_matrix_fieldset_legend = document.createElement("legend"),
        fx_matrix_fieldset_legend = document.createElement("legend"),
        actions_fieldset_legend = document.createElement("legend"),

        fx_matrix_fx_fieldset_legend = document.createElement("legend"),
        fx_matrix_chn_fieldset_legend = document.createElement("legend"),
        
        fx_types = ["Waveshaping"],

        ck_tmp = [],

        chn_settings,

        slice,

        row,
        cell,
        checkbox,
        
        i = 0, j = 0;
    
    if (detached_dialog) {
        dialog_div = detached_dialog.document.body;
    }
    
    // fieldset
    synthesis_matrix_fieldset.className = "fs-fieldset";
    fx_matrix_fieldset.className = "fs-fieldset";
    actions_fieldset.className = "fs-fieldset";
    fx_matrix_fx_fieldset.className = "fs-fieldset";
    fx_matrix_chn_fieldset.className = "fs-fieldset";
    
    dialog_div.style = "overflow: auto";
    dialog_div.innerHTML = "";
    
    synthesis_matrix_fieldset_legend.innerHTML = "Synthesis";
    fx_matrix_fieldset_legend.innerHTML = "FX";
    actions_fieldset_legend.innerHTML = "Actions";
    fx_matrix_fx_fieldset_legend.innerHTML = "Type";
    fx_matrix_chn_fieldset_legend.innerHTML = "Chn";
    
    synthesis_matrix_fieldset.appendChild(synthesis_matrix_fieldset_legend);
//    fx_matrix_fieldset.appendChild(fx_matrix_fieldset_legend);
    actions_fieldset.appendChild(actions_fieldset_legend);
//    fx_matrix_fx_fieldset.appendChild(fx_matrix_fx_fieldset_legend);
//    fx_matrix_chn_fieldset.appendChild(fx_matrix_chn_fieldset_legend);

    _applyCollapsible(synthesis_matrix_fieldset, synthesis_matrix_fieldset_legend);
//    _applyCollapsible(fx_matrix_fieldset, fx_matrix_fieldset_legend, true);
    _applyCollapsible(actions_fieldset, actions_fieldset_legend, true);

    // synthesis matrix
    synthesis_matrix_table.className = "fs-matrix";
    synthesis_matrix_fieldset.appendChild(synthesis_matrix_table);

    row = document.createElement("tr");
    row.className = "fs-matrix-first-row";
    cell = document.createElement("th");
    row.appendChild(cell);
    for (i = 0; i < _output_channels; i += 1) {
        cell = document.createElement("th");
        cell.innerHTML = i + 1;
        row.appendChild(cell);
    }

    synthesis_matrix_table.appendChild(row);    

    for (i = 0; i < _synthesis_types.length; i += 1) {
        if (!_synthesis_enabled[i]) {
            continue;
        }

        row = document.createElement("tr");

        cell = document.createElement("th");
        cell.className = "fs-matrix-first-cell";
        cell.innerHTML = _synthesis_types[i];
        row.appendChild(cell);
        
        for (j = 0; j < _output_channels; j += 1) {
            chn_settings = _chn_settings[j];

            cell = document.createElement("th");
            cell.className = "fs-matrix-ck-cell";
            checkbox = document.createElement("input");
            checkbox.name = j;
            checkbox.value = i;
            checkbox.type = "radio";

            // create channel settings if it does not exist
            if (!chn_settings) {
                _chn_settings[j] = [0, 6, 0.01, 0.1, 0.00001, 0];
                chn_settings = _chn_settings[j];
            }
            
            // check synthesis type from saved settings
            if (chn_settings[0] === i) {
                checkbox.checked = true;
            }

            checkbox.addEventListener("change", function () {
                var chn = parseInt(this.name, 10);

                _chn_settings[chn][0] = parseInt(this.value, 10);

                // save settings
                _local_session_settings.chn_settings[chn] = _chn_settings[chn];
                _saveLocalSessionSettings();
            
                // notify FAS
                clearTimeout(_fas_chn_notify_timeout);
                _fas_chn_notify_timeout = setTimeout(_fasNotifyChnInfos, 2000);

                _createSynthParametersContent();
            });

            ck_tmp.push(checkbox);

            cell.appendChild(checkbox);
            row.appendChild(cell);
        }

        // trigger change event on checked ones
        for (j = 0; j < ck_tmp.length; j += 1) {
            checkbox = ck_tmp[j];
            if (checkbox.checked) {
                checkbox.dispatchEvent(new UIEvent('change'));
            }
        }
        ck_tmp = [];

        synthesis_matrix_table.appendChild(row);
    }

    // open parameters button
    open_synth_params_btn.innerHTML = "Synth. parameters";
    open_synth_params_btn.className = "fs-btn fs-btn-default";

    open_synth_params_btn.style.width = "100%";
    open_synth_params_btn.style.marginTop = "12px";
    
    open_synth_params_btn.addEventListener("click", _openSynthParameters);

    synthesis_matrix_fieldset.appendChild(open_synth_params_btn);
    
    // load sample action
    load_samples_btn.innerHTML = "Reload samples";
    load_samples_btn.className = "fs-btn fs-btn-default";

    load_samples_btn.style.width = "100%";
    
    load_samples_btn.addEventListener("click", function () {
        _fasNotify(_FAS_ACTION, { type: 0 });
        _fasNotify(_FAS_AUDIO_INFOS, _audio_infos);
    });

    actions_fieldset.appendChild(load_samples_btn);
    
    dialog_div.appendChild(synthesis_matrix_fieldset);
    //dialog_div.appendChild(fx_matrix_fieldset);
    dialog_div.appendChild(actions_fieldset);  

    _createSynthParametersContent();    
};

var _showFxDialog = function (toggle_ev) {
    _createFxSettingsContent();
    WUI_Dialog.open(_fx_dialog);
};

var _showFasDialog = function (toggle_ev) {
    _createFasSettingsContent();
    WUI_Dialog.open(_fas_dialog);
};

var _toggleFas = function (toggle_ev) {
    if (toggle_ev.state) {
        document.getElementById("fs_fas_status").style = "";
        
        _fasEnable();
        
        _stopOscillators();
    } else {
        document.getElementById("fs_fas_status").style = "display: none";
        
        _fasDisable();
    }
};

var _toggleGridInfos = function (toggle_ev) {
    _xyf_grid = toggle_ev.state;
};

var _toggleDetachCodeEditor = function (toggle_ev) {
    if (toggle_ev.state) {
        _code_editor_element.style.display = "none";
    } else {
        _code_editor_element.style.display = "";
    }
    
    _undock_code_editor = toggle_ev.state;
};

var _showSpectrumDialog = function () {
    var analysis_dialog_content = document.getElementById(_analysis_dialog_id).childNodes[2];
    
    _analysis_canvas = document.createElement("canvas");
    _analysis_canvas_ctx = _analysis_canvas.getContext('2d');
    
    _analysis_canvas_tmp = document.createElement("canvas");
    _analysis_canvas_tmp_ctx = _analysis_canvas_tmp.getContext('2d');
    
    _analysis_canvas.width = 380;
    _analysis_canvas.height = 380;
    
    _analysis_canvas_tmp.width = _analysis_canvas.width;
    _analysis_canvas_tmp.height = _analysis_canvas.height;
    
    analysis_dialog_content.innerHTML = "";
    analysis_dialog_content.appendChild(_analysis_canvas);
    
    _connectAnalyserNode();
    
    WUI_Dialog.open(_analysis_dialog);
};

var _showRecordDialog = function () {
    _record = true;

    //if (_record) {
    //    _record = false;
        
    //    WUI_Dialog.close(_record_dialog);
    //} else {
    //   _record = true;
        
    WUI_Dialog.open(_record_dialog);
    //}
};

var _onImportDialogClose = function () {
    WUI_ToolBar.toggle(_wui_main_toolbar, 14);
    
    WUI_Dialog.close(_import_dialog);
};

var _onRecordDialogClose = function () {
    //WUI_ToolBar.toggle(_wui_main_toolbar, 7);
    
    // reattach the correct canvas
    var previous_canvas = _record_canvas;
    
    _record_canvas = _canvas.ownerDocument.getElementById("fs_record_canvas");
    _record_canvas_ctx = _record_canvas.getContext('2d');
    _record_canvas_ctx.drawImage(previous_canvas, 0, 0);
    
    _record = false;
};

var _showOutlineDialog = function () {
    WUI_Dialog.open(_outline_dialog);
};

var _showImportDialog = function (toggle_ev) {
    if (toggle_ev.state) {
        WUI_Dialog.open(_import_dialog);
    } else {
        WUI_Dialog.close(_import_dialog);
    }
};

var _toggleMIDIRecord = function (toggle_ev) {
    if (toggle_ev.state) {
        _record_type = 3;
    } else {
        _record_type = 1;
    }
};

var _toggleOSCRecord = function (toggle_ev) {
    if (toggle_ev.state) {
        _record_type = 2;
    } else {
        _record_type = 1;
    }
};

var _toggleAUDIORecord = function (toggle_ev) {
    _record_type = 1;
};

var _toggleALLRecord = function (toggle_ev) {
    if (toggle_ev.state) {
        _record_type = 0;
    } else {
        _record_type = 1;
    }
};

var _toggleAdditiveRecord = function () {
    if (_record_opts.f === _record_opts.additive) {
        _record_opts.f = _record_opts.default;
    } else {
        _record_opts.f = _record_opts.additive;
    }
};

var _toggleSubstractiveRecord = function () {
    if (_record_opts.f === _record_opts.substractive) {
        _record_opts.f = _record_opts.default;
    } else {
        _record_opts.f = _record_opts.substractive;
    }
};

var _toggleMultiplyRecord = function () {
    if (_record_opts.f === _record_opts.multiply) {
        _record_opts.f = _record_opts.default;
    } else {
        _record_opts.f = _record_opts.multiply;
    }
};

var _saveRecord = function () {
    var data_url = _record_canvas.toDataURL('image/png'),
        win;
    
    win = window.open();
    win.document.write("<img src='"+data_url+"'/>");
};

var _rewindRecording = function () {
    _record_position = 0;
    
    _record_canvas_ctx.clearRect(0, 0, _record_canvas.width, _record_canvas.height);
};

var _addRecordInput = function () {
    var tmp_image_data;

    tmp_image_data = _record_canvas_ctx.getImageData(0, 0, _record_canvas.width, _record_canvas.height);
    
    _imageDataToInput(tmp_image_data);
};

var _drawBrushHelper = function () {
    if (_paint_brush === null) {
        return;
    }
    
    var scale_x  = _paint_scalex,
        scale_y  = _paint_scaley,
        img    = _paint_brush,
        brush_width,
        brush_height,
        drawing_x,
        drawing_y,
        info_y = 0,
        info_txt = "",
        canvas_width_d2  = _c_helper.width / 2,
        canvas_height_d2 = _c_helper.height / 2;
    
    brush_width  = img.naturalWidth * scale_x;
    brush_height = img.naturalHeight * scale_y;
    
    // clear
    _c_helper.width = _c_helper.width;

    drawing_x = canvas_width_d2 - brush_width / 2;
    drawing_y = canvas_height_d2 - brush_height / 2;

    _c_helper_ctx.save();
    _c_helper_ctx.translate(canvas_width_d2, canvas_height_d2);
    _c_helper_ctx.rotate(_paint_angle);
    _c_helper_ctx.translate(drawing_x - canvas_width_d2, drawing_y - canvas_height_d2);
    _c_helper_ctx.scale(scale_x, scale_y);
    _c_helper_ctx.globalAlpha = _paint_opacity;
    _c_helper_ctx.drawImage(img, 0, 0);
    _c_helper_ctx.restore();
    
    brush_width = parseInt(brush_width, 10);
    brush_height = parseInt(brush_height, 10);
    
    if (brush_height > (window.innerHeight - 224)) {
        info_y = canvas_height_d2;
    } else {
        info_y = drawing_y + brush_height + 24;
    }
    
    if (img.naturalWidth === brush_width && img.naturalHeight === brush_height) {
        info_txt = parseInt(brush_width, 10) + "x" + parseInt(brush_height, 10);
    } else {
        info_txt = img.naturalWidth + "x" + img.naturalHeight + " - " + parseInt(brush_width, 10) + "x" + parseInt(brush_height, 10);
    }
    
    _c_helper_ctx.font = "14px Arial";
    _c_helper_ctx.textAlign = "center";
    _c_helper_ctx.fillStyle = "white";
    _c_helper_ctx.fillText(info_txt, canvas_width_d2, info_y);

    WUI.fadeIn(_c_helper);
    
    clearTimeout(_brush_helper_timeout);
    _brush_helper_timeout = setTimeout(function () {
            WUI.fadeOut(_c_helper);
        }, 2000);
};

/***********************************************************
    Init.
************************************************************/

var _uiInit = function () {
    _xhrContent("data/md/quickstart.md", function (md_content) {
        document.getElementById("fs_quickstart_content").innerHTML = _showdown_converter.makeHtml(md_content);
    });
    
    _xhrContent("data/md/uniforms.md", function (md_content) {
        var md_fieldset = document.createElement("fieldset"),
            md_fieldset_legend = document.createElement("legend"), 
            md_content_div = document.createElement("div"),
            doc_uniforms = document.getElementById("fs_documentation_uniforms");
        
        md_fieldset.className = "fs-fieldset";
        md_content_div.className = "fs-md-uniforms";
        
        md_fieldset_legend.innerHTML = "Pre-defined uniforms";
    
        md_fieldset.appendChild(md_fieldset_legend);
        md_fieldset.appendChild(md_content_div);
        doc_uniforms.appendChild(md_fieldset);

        _applyCollapsible(md_fieldset, md_fieldset_legend);

        md_content_div.innerHTML = _showdown_converter.makeHtml(md_content);
    });

    _xhrContent("data/md/pjs.md", function (md_content) {
        var md_fieldset = document.createElement("fieldset"),
            md_fieldset_legend = document.createElement("legend"), 
            md_content_div = document.createElement("div"),
            doc_uniforms = document.getElementById("fs_documentation_pjs");
        
        md_fieldset.className = "fs-fieldset";
        md_content_div.className = "fs-md-uniforms";
        
        md_fieldset_legend.innerHTML = "Pre-defined variables";
    
        md_fieldset.appendChild(md_fieldset_legend);
        md_fieldset.appendChild(md_content_div);
        doc_uniforms.appendChild(md_fieldset);

        _applyCollapsible(md_fieldset, md_fieldset_legend);

        md_content_div.innerHTML = _showdown_converter.makeHtml(md_content);

        md_content_div.innerHTML += '<br><br><a href="http://processingjs.org/reference/">Processing.js reference (Official)</a>';
    });
    
    // may don't scale at all in the future!
    var settings_ck_globaltime_elem = document.getElementById("fs_settings_ck_globaltime"),
        settings_ck_polyinfos_elem = document.getElementById("fs_settings_ck_polyinfos"),
        settings_ck_oscinfos_elem = document.getElementById("fs_settings_ck_oscinfos"),
        settings_ck_hlmatches_elem = document.getElementById("fs_settings_ck_hlmatches"),
        settings_ck_lnumbers_elem = document.getElementById("fs_settings_ck_lnumbers"),
        settings_ck_xscrollbar_elem = document.getElementById("fs_settings_ck_xscrollbar"),
        settings_ck_monophonic_elem = document.getElementById("fs_settings_ck_monophonic"),
        settings_ck_feedback_elem = document.getElementById("fs_settings_ck_feedback"),
        settings_ck_osc_out_elem = document.getElementById("fs_settings_ck_oscout"),
        settings_ck_osc_in_elem = document.getElementById("fs_settings_ck_oscin"),
        settings_ck_slices_elem = document.getElementById("fs_settings_ck_slices"),
        settings_ck_quickstart_elem = document.getElementById("fs_settings_ck_quickstart"),
        settings_ck_worklet_elem = document.getElementById("fs_settings_ck_audioworklet"),
        settings_ck_audio_elem = document.getElementById("fs_settings_ck_audio"),
        settings_ck_show_slice_chn_elem = document.getElementById("fs_settings_ck_show_slice_chn"),
        
        fs_settings_note_lifetime = localStorage.getItem('fs-note-lifetime'),
        fs_settings_max_polyphony = localStorage.getItem('fs-max-polyphony'),
        fs_settings_osc_fadeout = localStorage.getItem('fs-osc-fadeout'),
        fs_settings_show_globaltime = localStorage.getItem('fs-show-globaltime'),
        fs_settings_show_polyinfos = localStorage.getItem('fs-show-polyinfos'),
        fs_settings_show_oscinfos = localStorage.getItem('fs-show-oscinfos'),
        fs_settings_hlmatches = localStorage.getItem('fs-editor-hl-matches'),
        fs_settings_lnumbers = localStorage.getItem('fs-editor-show-linenumbers'),
        fs_settings_xscrollbar = localStorage.getItem('fs-editor-advanced-scrollbar'),
        fs_settings_monophonic = localStorage.getItem('fs-monophonic'),
        fs_settings_feedback = localStorage.getItem('fs-feedback'),
        fs_settings_osc_in = localStorage.getItem('fs-osc-in'),
        fs_settings_osc_out = localStorage.getItem('fs-osc-out'),
        fs_settings_quickstart = localStorage.getItem('fs-quickstart'),
        fs_settings_worklet = localStorage.getItem('fs-worklet'),
        fs_settings_audio = localStorage.getItem('fs-audio'),
        fs_settings_show_slice_chn = localStorage.getItem('fs-show-slice-chn');
    
    _settings_dialog = WUI_Dialog.create(_settings_dialog_id, {
            title: "Session & global settings",

            width: "320px",
            height: "auto",

            halign: "center",
            valign: "center",

            open: false,

            status_bar: false,
            detachable: false,
            minimizable: true,
            draggable: true,
        
            header_btn: [
                {
                    title: "Help",
                    on_click: function () {
                        window.open(_documentation_link + "settings/"); 
                    },
                    class_name: "fs-help-icon"
                }
            ]
    });
    
    if (_osc_mode !== _FS_WORKLET) {
        settings_ck_worklet_elem.checked = false;
        settings_ck_worklet_elem.disabled = true;
    } else {
        if (fs_settings_worklet === "true" || fs_settings_worklet === undefined) {
            settings_ck_worklet_elem.checked = true;
        } else {
            _osc_mode = _FS_OSC_NODES;
            settings_ck_worklet_elem.checked = false;
        }
    }
    
    if (fs_settings_monophonic === "true") {
        _audio_infos.monophonic = true;
        settings_ck_monophonic_elem.checked = true;
    } else {
        _audio_infos.monophonic = false;
        settings_ck_monophonic_elem.checked = false;
    }
    
    if (fs_settings_osc_in === "true") {
        settings_ck_osc_in_elem.checked = true;
    } else {
        settings_ck_osc_in_elem.checked = false;
    }
    
    if (fs_settings_osc_out === "true") {
        settings_ck_osc_out_elem.checked = true;
    } else {
        settings_ck_osc_out_elem.checked = false;
    }
    
    if (fs_settings_feedback === "true") {
        _feedback.enabled = true;
        settings_ck_feedback_elem.checked = true;
    } else if (fs_settings_feedback === null) {
        if (_feedback.enabled) {
            settings_ck_feedback_elem.checked = true;
        } else {
            settings_ck_feedback_elem.checked = false;
        }
    } else {
        _feedback.enabled = false;
        settings_ck_feedback_elem.checked = false;
    }
    
    if (fs_settings_osc_fadeout) {
        _osc_fadeout = parseFloat(fs_settings_osc_fadeout);
    }
    
    if (fs_settings_max_polyphony) {
        _keyboard.polyphony_max = _parseInt10(fs_settings_max_polyphony);
    }
    
    if (fs_settings_note_lifetime) {
        _keyboard.note_lifetime = _parseInt10(fs_settings_note_lifetime);
    }
    
    if (fs_settings_show_globaltime !== null) {
        _show_globaltime = (fs_settings_show_globaltime === "true");
    }
    
    if (fs_settings_show_oscinfos !== null) {
        _show_oscinfos = (fs_settings_show_oscinfos === "true");
    }
    
    if (fs_settings_show_polyinfos !== null) {
        _show_polyinfos = (fs_settings_show_polyinfos === "true");
    }

    if (fs_settings_hlmatches !== null) {
        _cm_highlight_matches = (fs_settings_hlmatches === "true");
    }
        
    if (fs_settings_lnumbers !== null) {
        _cm_show_linenumbers = (fs_settings_lnumbers === "true");
    }
        
    if (fs_settings_xscrollbar !== null) {
        _cm_advanced_scrollbar = (fs_settings_xscrollbar === "true");
    }
    
    if (fs_settings_quickstart  === "true") {
        settings_ck_quickstart_elem.checked = true;
    } else {
        settings_ck_quickstart_elem.checked = false;
    }
    
    _quickstart_on_startup = fs_settings_quickstart;
    
    if (_cm_advanced_scrollbar) {
        settings_ck_xscrollbar_elem.checked = true;
    } else {
        settings_ck_xscrollbar_elem.checked = false;
    }
    
    if (_show_oscinfos) {
        settings_ck_oscinfos_elem.checked = true;
    } else {
        settings_ck_oscinfos_elem.checked = false;
    }
    
    if (_show_polyinfos) {
        settings_ck_polyinfos_elem.checked = true;
    } else {
        settings_ck_polyinfos_elem.checked = false;
    }

    if (_show_globaltime) {
        settings_ck_globaltime_elem.checked = true;
    } else {
        settings_ck_globaltime_elem.checked = false;
    }
    
    if (_cm_highlight_matches) {
        settings_ck_hlmatches_elem.checked = true;
    } else {
        settings_ck_hlmatches_elem.checked = false;
    }
    
    if (_cm_show_linenumbers) {
        settings_ck_lnumbers_elem.checked = true;
    } else {
        settings_ck_lnumbers_elem.checked = false;
    }

    if (fs_settings_audio !== null) {
        _audio_off = (fs_settings_audio === "true");
    }

    if (_audio_off) {
        settings_ck_audio_elem.checked = true;
    } else {
        settings_ck_audio_elem.checked = false;
    }

    if (fs_settings_show_slice_chn === "true") {
        settings_ck_show_slice_chn_elem.checked = true;
    } else {
        settings_ck_show_slice_chn_elem.checked = false;
    }

    settings_ck_osc_in_elem.addEventListener("change", function () {
            if (this.checked) {
                _osc.in = true;
                
                _oscEnable();
            } else {
                _osc.in = false;
                
                _oscDisable();
            }
        
            localStorage.setItem('fs-osc-in', this.checked);
        });
    
    settings_ck_osc_out_elem.addEventListener("change", function () {
            if (this.checked) {
                _osc.out = true;
                
                _oscEnable();
            } else {
                _osc.out = false;
                
                _oscDisable();
            }
        
            localStorage.setItem('fs-osc-out', this.checked);
        });
    
    settings_ck_monophonic_elem.addEventListener("change", function () {
            if (this.checked) {
                _audio_infos.monophonic = true;
            } else {
                _audio_infos.monophonic = false;
            }
        
            localStorage.setItem('fs-monophonic', this.checked);
        });

    settings_ck_feedback_elem.addEventListener("change", function () {
            if (this.checked) {
                _feedback.enabled = true;
            } else {
                _feedback.enabled = false;
            }
        
            localStorage.setItem('fs-feedback', this.checked);
        
            _buildFeedback();
        });
    
    settings_ck_oscinfos_elem.addEventListener("change", function () {
            _show_oscinfos = this.checked;
        
            if (!_show_oscinfos) {
                _osc_infos.innerHTML = "";
            }
        
            localStorage.setItem('fs-show-oscinfos', _show_oscinfos);
        });
    
    settings_ck_polyinfos_elem.addEventListener("change", function () {
            _show_polyinfos = this.checked;
        
            if (!_show_polyinfos) {
                _poly_infos_element.innerHTML = "";
            }
        
            localStorage.setItem('fs-show-polyinfos', _show_polyinfos);
        });
    
    settings_ck_slices_elem.addEventListener("change", function () {
            var elements = document.getElementsByClassName("play-position-marker"),
                i = 0;
        
            if (!this.checked) {
                for(i = elements.length - 1; i >= 0; --i) {
                    elements[i].classList.add("fs-hide");
                }   
            } else {
                for(i = elements.length - 1; i >= 0; --i) {
                    elements[i].classList.remove("fs-hide");
                } 
            }
        });

    settings_ck_globaltime_elem.addEventListener("change", function () {
            _show_globaltime = this.checked;
        
            if (!_show_globaltime) {
                _time_infos.innerHTML = "";
            }
        
            localStorage.setItem('fs-show-globaltime', _show_globaltime);
        });
    
    settings_ck_hlmatches_elem.addEventListener("change", function () {
            _cm_highlight_matches = this.checked;
        
            if (_cm_highlight_matches) {
                _code_editor_settings.highlightSelectionMatches = _code_editor_highlight;
                
                _code_editor.setOption("highlightSelectionMatches", _code_editor_highlight);
            } else {
                delete _code_editor_settings.highlightSelectionMatches;
                
                _code_editor.setOption("highlightSelectionMatches", null);
            }
        
            localStorage.setItem('fs-editor-hl-matches', _cm_highlight_matches);
        });

    settings_ck_lnumbers_elem.addEventListener("change", function () {
            _cm_show_linenumbers = this.checked;
        
            _code_editor_settings.lineNumbers = _cm_show_linenumbers;
        
            _code_editor.setOption("lineNumbers", _cm_show_linenumbers);
        
            localStorage.setItem('fs-editor-show-linenumbers', _cm_show_linenumbers);
        });
    
    settings_ck_xscrollbar_elem.addEventListener("change", function () {
            _cm_advanced_scrollbar = this.checked;
        
            if (_cm_advanced_scrollbar) {
                _code_editor_settings.scrollbarStyle = "overlay";
                
                _code_editor.setOption("scrollbarStyle", "overlay");
            } else {
                _code_editor_settings.scrollbarStyle = "native";
                
                _code_editor.setOption("scrollbarStyle", "native");
            }
        
            localStorage.setItem('fs-editor-advanced-scrollbar', _cm_advanced_scrollbar);
        });
    
    settings_ck_quickstart_elem.addEventListener("change", function () {
            _quickstart_on_startup = this.checked;
        
            localStorage.setItem('fs-quickstart', _quickstart_on_startup);
        
            if (!_quickstart_on_startup) {
                WUI_Dialog.close(_quickstart_dialog);
            }
        });
    
    settings_ck_worklet_elem.addEventListener("change", function () {
        if (this.checked) {
            _osc_mode = _FS_WORKLET;
            _stopOscillators();
            _connectWorklet();
        } else {
            _osc_mode = _FS_OSC_NODES;
            _disconnectWorklet();
        }
    
        localStorage.setItem('fs-worklet', this.checked);
    });

    settings_ck_audio_elem.addEventListener("change", function () {
        if (this.checked) {
            _audio_off = true;

            _stopOscillators();
            _pauseWorklet();
        } else {
            _playWorklet();
            _audio_off = false;
        }
    
        localStorage.setItem('fs-audio', this.checked);
    });

    settings_ck_show_slice_chn_elem.addEventListener("change", function () {
        if (this.checked) {
            _show_output_channels = true;
        } else {
            _show_output_channels = false;
        }

        _updateSliceChnVisibility();
    
        localStorage.setItem('fs-show-slice-chn', this.checked);
    });
    
    settings_ck_oscinfos_elem.dispatchEvent(new UIEvent('change'));
    settings_ck_polyinfos_elem.dispatchEvent(new UIEvent('change'));
    settings_ck_globaltime_elem.dispatchEvent(new UIEvent('change'));
    settings_ck_hlmatches_elem.dispatchEvent(new UIEvent('change'));
    settings_ck_lnumbers_elem.dispatchEvent(new UIEvent('change'));
    settings_ck_xscrollbar_elem.dispatchEvent(new UIEvent('change'));
    settings_ck_monophonic_elem.dispatchEvent(new UIEvent('change'));
    settings_ck_feedback_elem.dispatchEvent(new UIEvent('change'));
    settings_ck_osc_in_elem.dispatchEvent(new UIEvent('change'));
    settings_ck_osc_out_elem.dispatchEvent(new UIEvent('change'));
    settings_ck_slices_elem.dispatchEvent(new UIEvent('change'));
    settings_ck_quickstart_elem.dispatchEvent(new UIEvent('change'));
    settings_ck_worklet_elem.dispatchEvent(new UIEvent('change'));
    settings_ck_audio_elem.dispatchEvent(new UIEvent('change'));
    settings_ck_show_slice_chn_elem.dispatchEvent(new UIEvent('change'));
    
    _midi_settings_dialog = WUI_Dialog.create(_midi_settings_dialog_id, {
            title: "MIDI I/O",

            width: "320px",
            height: "480px",
        
            min_height: 120,

            halign: "center",
            valign: "center",

            open: false,

            status_bar: false,
            detachable: true,
            minimizable: true,
            draggable: true,
        
            on_detach: function (new_window) {
                new_window.document.body.style.overflow = "hidden";
            },
        
            header_btn: [
                {
                    title: "Help",
                    on_click: function () {
                        window.open(_documentation_link + "tutorials/midi/"); 
                    },
                    class_name: "fs-help-icon"
                }
            ]
        });
    
    _record_dialog = WUI_Dialog.create(_record_dialog_id, {
            title: "Recording...",

            width: "auto",
            height: "auto",

            halign: "center",
            valign: "center",

            open: false,

            status_bar: false,
            detachable: true,
            minimizable: false,
            draggable: true,
        
            on_close: _onRecordDialogClose,

            header_btn: [
                {
                    title: "Help",
                    on_click: function () {
                        window.open(_documentation_link + "tutorials/spectral_record/"); 
                    },
                    class_name: "fs-help-icon"
                }
            ],
        
            on_detach: function (new_window) {
                var previous_canvas = _record_canvas;
                
                _record_canvas = new_window.document.getElementById("fs_record_canvas");
                _record_canvas_ctx = _record_canvas.getContext('2d');

                _record_canvas_ctx.drawImage(previous_canvas, 0, 0);
            }
        });
    
    _fx_dialog = WUI_Dialog.create(_fx_dialog_id, {
        title: "FX Settings",

        width: "auto",
        height: "auto",
    
        min_width: 340,
        min_height: 80,

        halign: "center",
        valign: "center",

        open: false,

        status_bar: false,
        detachable: true,
        minimizable: true,
        draggable: true,
    
        on_detach: function (new_window) {
            _createFxSettingsContent();
        },
    
        header_btn: [
            {
                title: "Help",
                on_click: function () {
                    window.open(_documentation_link + "tutorials/audio_server_fx/"); 
                },
                class_name: "fs-help-icon"
            }
        ]
    });
    
    _fas_dialog = WUI_Dialog.create(_fas_dialog_id, {
            title: "FAS Settings",

            width: "auto",
            height: "auto",
        
            min_width: 340,
            min_height: 80,

            halign: "center",
            valign: "center",

            open: false,

            status_bar: false,
            detachable: true,
            minimizable: true,
            draggable: true,
        
            on_detach: function (new_window) {
                _createFasSettingsContent();
            },
        
            header_btn: [
                {
                    title: "Help",
                    on_click: function () {
                        window.open(_documentation_link + "tutorials/audio_server/"); 
                    },
                    class_name: "fs-help-icon"
                }
            ]
        });
    
    _fas_synth_params_dialog = WUI_Dialog.create(_fas_synth_params_dialog_id, {
        title: "Synthesis parameters",

        width: "auto",
        height: "auto",
    
        min_width: 340,
        min_height: 80,

        halign: "center",
        valign: "center",

        open: false,

        status_bar: false,
        detachable: true,
        minimizable: true,
        draggable: true,
    
        on_detach: function (new_window) {
            _createSynthParametersContent();
        },
    
        header_btn: [
            {
                title: "Help",
                on_click: function () {
                    window.open(_documentation_link + "tutorials/audio_server/"); 
                },
                class_name: "fs-help-icon"
            }
        ]
    });
    
    _import_dialog = WUI_Dialog.create(_import_dialog_id, {
            title: "Import dialog (images etc.)",

            width: "550px",
            height: "auto",
            min_height: "80px",

            halign: "center",
            valign: "center",

            open: false,

            status_bar: false,
            detachable: true,
            minimizable: true,
            draggable: true,
        
            on_close: _onImportDialogClose,
        
            header_btn: [
                {
                    title: "Help",
                    on_click: function () {
                        window.open(_documentation_link + "tutorials/import/"); 
                    },
                    class_name: "fs-help-icon"
                }
            ]
        });
    
    WUI_ToolBar.create("fs_import_toolbar", {
                allow_groups_minimize: false
            },
            {
                acts: [
                    {
                        icon: "fs-image-file-icon",
                        on_click: (function () { _loadFile("image")(); }),
                        tooltip: "Image",
                        text: "Img"
                    },
                    {
                        icon: "fs-audio-file-icon",
                        on_click: (function () { _loadFile("audio")(); }),
                        tooltip: "Audio",
                        text: "Snd"
                    },
                    {
                        icon: "fs-video-icon",
                        on_click: (function () { _loadFile("video")(); }),
                        tooltip: "Video",
                        text: "Mov"
                    },
                    {
                        icon: "fs-camera-icon",
                        on_click: (function () { _addFragmentInput("camera"); }),
                        tooltip: "Webcam",
                        text: "Cam"
                    },
                    {
                        icon: "fs-dsk-icon",
                        on_click: (function () { _addFragmentInput("desktop"); }),
                        tooltip: "Desktop",
                        text: "Dsk"
                    },
                    {
                        icon: "fs-canvas-icon",
                        on_click: (function () { _addFragmentInput("canvas"); }),
                        tooltip: "Cvs",
                        text: "Cvs"
                    },
                    {
                        icon: "fs-pjs-icon",
                        on_click: (function () { _addFragmentInput("processing.js"); }),
                        tooltip: "Pjs",
                        text: "Pjs"
                    }
                ]
            });
    
    _outline_dialog = WUI_Dialog.create(_outline_dialog_id, {
            title: "GLSL Outline",

            width: "380px",
            height: "auto",
        
            min_height: 32,

            halign: "center",
            valign: "center",

            open: false,

            status_bar: false,
            detachable: true,
            minimizable: true,
            draggable: true,
        
            on_detach: function (new_window) {
                new_window.document.body.style.overflow = "hidden";
            }
        });
    
    WUI_Dialog.create("fs_username_dialog", {
        title: "Username",

        width: "280px",
        height: "auto",
    
        min_height: 32,

        halign: "center",
        valign: "center",

        open: false,
        modal: true,

        status_bar: false,
        detachable: false,
        draggable: true
    });

    _slices_dialog = WUI_Dialog.create(_slices_dialog_id, {
        title: "Slices",

        width: "280px",
        height: "auto",
    
        min_height: 16,

        halign: "center",
        valign: "center",

        on_open: _openedSlicesDialog,
        on_close: _closedSlicesDialog,

        open: false,

        status_bar: false,
        detachable: false,
        draggable: true,
        minimizable: true,
    
        header_btn: [
            {
                title: "Help",
                on_click: function () {
                    window.open(_documentation_link + "tutorials/slices/"); 
                },
                class_name: "fs-help-icon"
            }
        ]
    });
    
/*
    _analysis_dialog = WUI_Dialog.create(_analysis_dialog_id, {
            title: "Audio analysis",

            width: "380px",
            height: "380px",

            halign: "center",
            valign: "center",

            open: false,

            status_bar: false,
            detachable: false,
            draggable: true,
        
            on_close: _disconnectAnalyserNode
        });
*/

    _help_dialog = WUI_Dialog.create(_help_dialog_id, {
            title: "Fragment - Help",

            width: "440px",
            height: "auto",

            halign: "center",
            valign: "center",

            open: false,

            status_bar: false,
            detachable: true,
            draggable: true,
            minimizable: true,
            
            top: 200
        });
    
    _paint_dialog = WUI_Dialog.create(_paint_dialog_id, {
            title: "Paint tools",

            width: "400px",
            height: "520px",

            halign: "center",
            valign: "center",

            open: false,

            detachable: true,
            resizable: true,

            status_bar: false,
            draggable: true,
            minimizable: true,
        
            on_detach: function (new_window) {
                new_window.document.body.style.overflow = "hidden";
            },
        
            header_btn: [
                {
                    title: "Help",
                    on_click: function () {
                        window.open(_documentation_link + "tutorials/canvas_import/"); 
                    },
                    class_name: "fs-help-icon"
                }
            ]
        });
    
    _quickstart_dialog = WUI_Dialog.create(_quickstart_dialog_id, {
            title: "Fragment Quickstart guide",

            width: Math.min(Math.round(window.innerWidth * 0.9), 840) + "px",
            height: Math.min(Math.round(window.innerHeight * 0.9), 740) + "px",

            halign: "center",
            valign: "center",

            open: _quickstart_on_startup,

            detachable: true,

            status_bar: true,
            status_bar_content: _motd,
            draggable: true,
            minimizable: true,
        
            header_btn: [
                {
                    title: "Help",
                    on_click: function () {
                        window.open(_documentation_link + "getting_started/"); 
                    },
                    class_name: "fs-help-icon"
                }
            ]
    });

    WUI_Tabs.create("fs_help_tabs", {
        height: "auto"
    });

    WUI_ToolBar.create("fs_record_toolbar", {
                allow_groups_minimize: false
            },
            {
                ctrl: [
                    {
                        icon: "fs-reset-icon",
                        on_click: _rewindRecording,
                        tooltip: "Reset recording"
                    }
                ],
                type: [
                    {
                        icon: "fs-midi-icon",
                        type: "toggle",
                        toggle_state: false,
                        on_click: _toggleMIDIRecord,
                        tooltip: "Only show MIDI output",
                        toggle_group: 0
                    },
                    {
                        icon: "fs-osc-icon",
                        type: "toggle",
                        toggle_state: false,
                        on_click: _toggleOSCRecord,
                        tooltip: "Only show OSC output",
                        toggle_group: 0
                    },
                    {
                        icon: "fs-fas-icon",
                        type: "toggle",
                        toggle_state: true,
                        on_click: _toggleAUDIORecord,
                        tooltip: "Only show AUDIO output",
                        toggle_group: 0
                    },
                    {
                        icon: "fs-all-icon",
                        type: "toggle",
                        toggle_state: false,
                        on_click: _toggleALLRecord,
                        tooltip: "Show all output",
                        toggle_group: 0
                    }
                ],
                opts: [
                    {
                        icon: "fs-plus-symbol-icon",
                        type: "toggle",
                        toggle_state: false,
                        on_click: _toggleAdditiveRecord,
                        tooltip: "Additive",
                        toggle_group: 1
                    },
                    {
                        icon: "fs-minus-symbol-icon",
                        type: "toggle",
                        toggle_state: false,
                        on_click: _toggleSubstractiveRecord,
                        tooltip: "Substractive",
                        toggle_group: 1
                    },
                    {
                        icon: "fs-multiply-symbol-icon",
                        type: "toggle",
                        toggle_state: false,
                        on_click: _toggleMultiplyRecord,
                        tooltip: "Multiply",
                        toggle_group: 1
                    }
                ],
                acts: [
                    {
                        icon: "fs-plus-icon",
                        on_click: _addRecordInput,
                        tooltip: "Add as input"
                    },
                    {
                        icon: "fs-audio-file-icon",
                        on_click: _exportRecord,
                        tooltip: "Export as .wav"
                    },
                    {
                        icon: "fs-save-icon",
                        on_click: _saveRecord,
                        tooltip: "Save as PNG"
                    }
                ]
            });
    
    WUI_ToolBar.create("fs_paint_toolbar", {
            allow_groups_minimize: false
        },
        {
            acts: [
                {
                    icon: "fs-eraser-icon",
                    on_click: function () {
                        _canvasInputClear(_selected_input_canvas);
                        _canvasInputUpdate(_selected_input_canvas);
                    },
                    tooltip: "Clear canvas"
                },
                {
                    icon: "fs-lockx-icon",
                    type: "toggle",
                    toggle_state: false,
                    on_click: function () {
                        _paint_lock_x = !_paint_lock_x;
                    },
                    tooltip: "Lock horizontal axis"
                },
                {
                    icon: "fs-locky-icon",
                    type: "toggle",
                    toggle_state: false,
                    on_click: function () {
                        _paint_lock_y = !_paint_lock_y;
                    },
                    tooltip: "Lock vertical axis"
                },
                {
                    icon: "fs-dice-icon",
                    type: "toggle",
                    toggle_state: false,
                    on_click: function () {
                        _paint_random = !_paint_random;
                    },
                    tooltip: "Randomize scale, opacity and angle"
                }
            ],
            compositing: [
                {
                    text: "Compositing",
                    tooltip: "Compositing method",
                    type: "dropdown",
                    
                    orientation: "s",
                    dropdown_items_width: "80px",

                    items: [
                      {
                        title: "source-over",
                        on_click: _setPaintCompositingMode("source-over")
                      },
                      {
                        title: "source-in",
                        on_click: _setPaintCompositingMode("source-in")
                      },
                      {
                        title: "source-out",
                        on_click: _setPaintCompositingMode("source-out")
                      },
                      {
                        title: "source-atop",
                        on_click: _setPaintCompositingMode("source-atop")
                      },
                      {
                        title: "destination-over",
                        on_click: _setPaintCompositingMode("destination-over")
                      },
                      {
                        title: "destination-in",
                        on_click: _setPaintCompositingMode("destination-in")
                      },
                      {
                        title: "destination-out",
                        on_click: _setPaintCompositingMode("destination-out")
                      },
                      {
                        title: "destination-atop",
                        on_click: _setPaintCompositingMode("destination-atop")
                      },
                      {
                        title: "lighter",
                        on_click: _setPaintCompositingMode("lighter")
                      },
                      {
                        title: "copy",
                        on_click: _setPaintCompositingMode("copy")
                      },
                      {
                        title: "xor",
                        on_click: _setPaintCompositingMode("xor")
                      },
                      {
                        title: "multiply",
                        on_click: _setPaintCompositingMode("multiply")
                      },
                      {
                        title: "screen",
                        on_click: _setPaintCompositingMode("screen")
                      },
                      {
                        title: "overlay",
                        on_click: _setPaintCompositingMode("overlay")
                      },
                      {
                        title: "darken",
                        on_click: _setPaintCompositingMode("darken")
                      },
                      {
                        title: "lighten",
                        on_click: _setPaintCompositingMode("lighten")
                      },
                      {
                        title: "color-dodge",
                        on_click: _setPaintCompositingMode("color-dodge")
                      },
                      {
                        title: "color-burn",
                        on_click: _setPaintCompositingMode("color-burn")
                      },
                      {
                        title: "hard-light",
                        on_click: _setPaintCompositingMode("hard-light")
                      },
                      {
                        title: "soft-light",
                        on_click: _setPaintCompositingMode("soft-light")
                      },
                      {
                        title: "difference",
                        on_click: _setPaintCompositingMode("difference")
                      },
                      {
                        title: "exclusion",
                        on_click: _setPaintCompositingMode("exclusion")
                      },
                      {
                        title: "hue",
                        on_click: _setPaintCompositingMode("hue")
                      },
                      {
                        title: "saturation",
                        on_click: _setPaintCompositingMode("saturation")
                      },
                      {
                        title: "color",
                        on_click: _setPaintCompositingMode("color")
                      },
                      {
                        title: "luminosity",
                        on_click: _setPaintCompositingMode("luminosity")
                      }
                    ]
                }
            ]
        });

    _wui_main_toolbar = WUI_ToolBar.create("fs_middle_toolbar", {
            allow_groups_minimize: false,
            show_groups_title: false,
            groups_title_orientation: "n"
        },
        {
            "Help": [
                {
                    id: "fs_tb_help",
                    icon: "fs-help-icon",
                    on_click: _showHelpDialog,
                    tooltip: "Help"
                }
            ],
            "Social": [
                {
                    id: "fs_tb_chat",
                    icon: "fs-discuss-icon",
                    on_click: function () {
                        WUI_Dialog.open(_discuss_dialog_id);
                    },
                    tooltip: "Session chat"
                },
                {
                    id: "fs_tb_forum",
                    icon: "fs-board-icon",
                    on_click: function () {
                        window.open("https://quiet.fsynth.com", '_blank');
                    },
                    tooltip: "Message board"
                }
            ],
            "Settings": [
                {
                    id: "fs_tb_settings",
                    icon: "fs-gear-icon",
                    on_click: _showSettingsDialog,
                    tooltip: "Settings"
                },
                {
                    id: "fs_tb_midi_settings",
                    icon: "fs-midi-icon",
                    on_click: _showMIDISettingsDialog,
                    tooltip: "MIDI Settings"
                }
            ],
            "Transport": [
                {
                    id: "fs_tb_reset",
                    icon: "fs-reset-icon",
                    on_click: _rewind,
                    tooltip: "Rewind (globalTime = 0)"
                },
                {
                    id: "fs_tb_pause",
                    icon: "fs-pause-icon",
                    type: "toggle",
                    toggle_state: (_fs_state === 1 ? true : false),
                    on_click: _togglePlay,
                    tooltip: "Play/Pause"
                },
                {
                    id: "fs_tb_record",
                    icon: "fs-record-icon",
                    on_click: _showRecordDialog,
                    tooltip: "Record"
                }
            ],
            "FAS": [
                {
                    id: "fs_tb_fas",
                    icon: "fs-fas-icon",
                    type: "toggle",
                    toggle_state: _fasEnabled(),
                    on_click: _toggleFas,
                    tooltip: "Enable/Disable audio server connection (the audio server is available on the homepage)"
                },
                {
                    id: "fs_tb_fas_settings",
                    icon: "fs-gear-icon",
                    on_click: _showFasDialog,
                    tooltip: "Audio server settings"
                }/*,
                {
                    icon: "fs-fx-icon",
                    on_click: _showFxDialog,
                    tooltip: "Audio server fx settings"
                }*/
            ],
            "Tools": [
                {
                    id: "fs_tb_shadertoy",

                    icon: "fs-shadertoy-icon",

                    toggle_state: false,

                    tooltip: "Convert Shadertoy shader",

                    on_click: function () {
                        var input_code  = _code_editor.getValue(),
                            output_code = input_code;

                        output_code = output_code.replace(/void\s+mainImage\s*\(\s*out\s+vec4\s*[a-zA-Z]+,\s*(in)?\s+vec2\s+[a-zA-Z]+\s*\)/, "void main ()");
                        output_code = output_code.replace(/fragCoord/g, "gl_FragCoord");
                        output_code = output_code.replace(/fragColor/g, "gl_FragColor");
                        output_code = output_code.replace(/iResolution/g, "resolution");
                        output_code = output_code.replace(/iTime/g, "globalTime");
                        output_code = output_code.replace(/iMouse/g, "mouse");
                        output_code = output_code.replace(/iChannel/g, "iInput");

                        _code_editor.setValue(output_code);

                        _compile();
                    }
                },
                {
                    id: "fs_tb_xyf",
                    icon: "fs-xyf-icon",
                    type: "toggle",
                    toggle_state: _xyf_grid,
                    on_click: _toggleGridInfos,
                    tooltip: "Hide/Show mouse hover axis grid"
                }/*, // DISABLED
                {
                    icon: "fs-spectrum-icon",
                    on_click: _showSpectrumDialog,
                    tooltip: "Audio analysis dialog"
                }*/,
                {
                    id: "fs_tb_outline",
                    icon: "fs-function-icon",
                    on_click: _showOutlineDialog,
                    tooltip: "Outline"
                },
                {
                    id: "fs_tb_code",
                    icon: "fs-code-icon",
                    on_click: _detachCodeEditor,
                    tooltip: "Clone the GLSL editor into a separate window"
                }
            ],
            "Import": [
/*
                // DISABLED
                {
                    icon: "fs-controls-icon",
                    on_click: _showControlsDialog,
                    tooltip: "Controllers input"
                },
*/
                {
                    id: "fs_tb_import",
                    icon: _icon_class.plus,
                    type: "toggle",
                    on_click: _showImportDialog,
                    tooltip: "Import Fragment input"
                }
            ]
        });
    
    WUI_RangeSlider.create("fs_paint_slider_delay",  {
            width: 120,
            height: 8,

            min: 0,
            max: 500,

            step: 1,

            midi: true,
        
            default_value: _paint_delay,
            value: _paint_delay,

            title: "Brush spacing",

            title_min_width: 110,
            value_min_width: 48,

            configurable: {
                min: {},
                max: {},
                step: {},
                scroll_step: {}
            },

            on_change: function (value) {
                _paint_delay = value;
            }
        });
    
    WUI_RangeSlider.create("fs_paint_slider_scalex",  {
            width: 120,
            height: 8,

            min: 0,
            max: 10,

            step: 0.001,

            midi: true,
        
            default_value: _paint_scalex,
            value: _paint_scalex,

            title: "Brush scale x",

            title_min_width: 110,
            value_min_width: 48,

            configurable: {
                min: {},
                max: {},
                step: {},
                scroll_step: {}
            },

            on_change: function (value) {
                _paint_scalex = value;
                
                _drawBrushHelper();
            }
        });
    
    WUI_RangeSlider.create("fs_paint_slider_scaley",  {
            width: 120,
            height: 8,

            min: 0,
            max: 10,

            step: 0.001,
        
            midi: true,
        
            default_value: _paint_scaley,
            value: _paint_scaley,

            title: "Brush scale y",

            title_min_width: 110,
            value_min_width: 48,

            configurable: {
                min: {},
                max: {},
                step: {},
                scroll_step: {}
            },

            on_change: function (value) {
                _paint_scaley = value;
                
                _drawBrushHelper();
            }
        });
    
    WUI_RangeSlider.create("fs_paint_slider_opacity", {
            width: 120,
            height: 8,

            min: 0.0,
            max: 1.0,

            step: 0.001,
            scroll_step: 0.01,

            midi: true,

            default_value: _paint_opacity,
            value: _paint_opacity,

            title: "Brush opacity",

            title_min_width: 110,
            value_min_width: 48,
        
            configurable: {
                step: {},
                scroll_step: {}
            },

            on_change: function (value) {
                _paint_opacity = value;
                
                _drawBrushHelper();
            }
        });

    WUI_RangeSlider.create("fs_paint_slider_angle", {
            width: 120,
            height: 8,

            min: 0.0,
            max: 360.0,

            step: 1,
            scroll_step: 0.01,

            midi: true,

            default_value: _paint_angle,
            value: _paint_angle,

            title: "Brush angle",

            title_min_width: 110,
            value_min_width: 48,
        
            configurable: {
                step: {},
                scroll_step: {}
            },

            on_change: function (value) {
                _paint_angle = _degToRad(value);
                
                _drawBrushHelper();
            }
        });

    WUI_RangeSlider.create("fs_score_width_input", {
            width: 120,
            height: 8,

            min: 0,

            bar: false,

            step: 1,
            scroll_step: 1,

            default_value: _canvas_width,
            value: _canvas_width,

            title: "Score width",

            title_min_width: 140,
            value_min_width: 88,

            on_change: function (new_width) { _updateScore({ width: new_width }, true); }
        });

    WUI_RangeSlider.create("fs_score_height_input", {
            width: 120,
            height: 8,

            min: 16,

            bar: false,

            step: 1,
            scroll_step: 1,

            default_value: _canvas_height,
            value: _canvas_height,

            title: "Score height (resolution)",

            title_min_width: 140,
            value_min_width: 88,

            on_change: function (new_height) { _updateScore({ height: new_height }, true); }
        });

    WUI_RangeSlider.create("fs_score_base_input", {
            width: 120,
            height: 8,

            min: 0,

            bar: false,

            step: "any",
            scroll_step: 0.01,
        
            decimals: 2,

            default_value: 16.34,
            value: 16.34,

            title: "Score base frequency",

            title_min_width: 140,
            value_min_width: 88,

            on_change: function (new_base_freq) { _updateScore({ base_freq: new_base_freq }, true); }
        });

    WUI_RangeSlider.create("fs_score_octave_input", {
            width: 120,
            height: 8,

            min: 1,

            bar: false,

            step: 1,
            scroll_step: 1,

            default_value: 10,
            value: 10,

            title: "Score octave range",

            title_min_width: 140,
            value_min_width: 88,

            on_change: function (new_range) { _updateScore({ octave: new_range }, true); }
        });
    
    WUI_RangeSlider.create("fs_settings_max_polyphony", {
            width: 120,
            height: 8,

            min: 1,
        
            bar: false,

            step: 1,
            scroll_step: 1,

            default_value: _keyboard.polyphony_max,
            value: _keyboard.polyphony_max,

            title: "Polyphony",

            title_min_width: 140,
            value_min_width: 88,

            on_change: function (polyphony) {
                var i = 0;
                
                if (polyphony <= 0) {
                    return;
                }
                
                _keyboard.polyphony_max = polyphony;
                
                localStorage.setItem('fs-max-polyphony', _keyboard.polyphony_max);
                
                _keyboard.data = [];
                
                _keyboard.data_length = _keyboard.polyphony_max * _keyboard.data_components;

                for (i = 0; i < _keyboard.data_length; i += 1) {
                    _keyboard.data[i] = 0;
                }
                
                _compile();
            }
        });
    
    WUI_RangeSlider.create("fs_settings_note_lifetime", {
            width: 120,
            height: 8,

            min: 0,
        
            bar: false,

            step: 10,
            scroll_step: 10,

            default_value: _keyboard.note_lifetime,
            value: _keyboard.note_lifetime,

            title: "Note lifetime (ms)",

            title_min_width: 140,
            value_min_width: 88,

            on_change: function (note_lifetime) {
                if (note_lifetime <= 0) {
                    return;
                }
                
                _keyboard.note_lifetime = note_lifetime;
                
                localStorage.setItem('fs-note-lifetime', _keyboard.note_lifetime);
            }
        });
    
    WUI_RangeSlider.create("fs_settings_osc_fade_input", {
            width: 120,
            height: 8,

            min: 0.01,

            bar: false,

            step: 0.01,
            scroll_step: 0.01,
        
            decimals: 2,

            default_value: _osc_fadeout,
            value: _osc_fadeout,

            title: "Osc. fadeout",

            title_min_width: 140,
            value_min_width: 88,

            on_change: function (new_fadeout) {
                if (new_fadeout <= 0) {
                    return;
                }
                
                _osc_fadeout = new_fadeout;
                
                localStorage.setItem('fs-osc-fadeout', _osc_fadeout);
            }
        });

    WUI_RangeSlider.create("mst_slider", {
            width: 100,
            height: 8,

            min: 0.0,
            max: 1.0,

            bar: false,

            step: "any",
            scroll_step: 0.01,
        
            decimals: 2,

            midi: true,

            default_value: _volume,
            value: _volume,

            title: "Gain",

            title_min_width: 32,
            value_min_width: 48,

            on_change: function (value) {
                _local_session_settings.gain = value;
                _saveLocalSessionSettings();

                _setGain(value);

                _fasNotify(_FAS_GAIN_INFOS, _audio_infos);
            }
        });
    
    WUI_RangeSlider.create("fs_import_audio_winalpha_settings", {
            width: 100,
            height: 8,

            min: 0,
            max: 10,

            bar: false,

            step: "any",
            scroll_step: 0.001,
        
            decimals: 4,

            midi: false,

            default_value: _audio_import_settings.window_alpha,
            value: _audio_import_settings.window_alpha,

            title: "Window alpha",

            title_min_width: 84,
            value_min_width: 64,

            on_change: function (value) {
                _audio_import_settings.window_alpha = value;
            }
        });

    WUI_RangeSlider.create("fs_import_audio_winlength_settings", {
            width: 100,
            height: 8,

            min: 0,

            bar: false,

            step: "any",
            scroll_step: 1024,

            midi: false,

            default_value: _audio_import_settings.window_length,
            value: _audio_import_settings.window_length,

            title: "Window length",

            title_min_width: 84,
            value_min_width: 64,

            on_change: function (value) {
                _audio_import_settings.window_length = parseInt(value, 10);
            }
        });
    
    WUI_RangeSlider.create("fs_import_audio_overlap_settings", {
            width: 100,
            height: 8,

            min: 0,

            bar: false,

            step: "any",
            scroll_step: 1024,

            midi: false,

            default_value: _audio_import_settings.overlap,
            value: _audio_import_settings.overlap,

            title: "Overlap",

            title_min_width: 84,
            value_min_width: 64,

            on_change: function (value) {
                _audio_import_settings.overlap = parseInt(value, 10);
            }
        });
    
    WUI_RangeSlider.create("fs_import_audio_bpm_settings", {
            width: 100,
            height: 8,

            min: 0,

            bar: false,

            step: "any",
            scroll_step: 1,

            midi: false,

            default_value: _audio_import_settings.bpm,
            value: _audio_import_settings.bpm,

            title: "BPM",

            title_min_width: 84,
            value_min_width: 64,

            on_change: function (value) {
                _audio_import_settings.bpm = parseInt(value, 10);
            }
        });
    
    WUI_RangeSlider.create("fs_import_audio_ppb_settings", {
            width: 100,
            height: 8,

            min: 0,

            bar: false,

            step: "any",
            scroll_step: 1,

            midi: false,

            default_value: _audio_import_settings.ppb,
            value: _audio_import_settings.ppb,

            title: "PPB",

            title_min_width: 84,
            value_min_width: 64,

            on_change: function (value) {
                _audio_import_settings.ppb = parseInt(value, 10);
            }
        });
    
    WUI_RangeSlider.create("fs_import_audio_height_settings", {
            width: 100,
            height: 8,

            min: 0,

            bar: false,

            step: "any",
            scroll_step: 1,

            midi: false,

            default_value: _audio_import_settings.height,
            value: _audio_import_settings.height,

            title: "Height",

            title_min_width: 84,
            value_min_width: 64,

            on_change: function (value) {
                _audio_import_settings.height = parseInt(value, 10);
            }
        });
    
    WUI_RangeSlider.create("fs_import_audio_minfreq_settings", {
            width: 100,
            height: 8,

            min: 0,

            bar: false,

            step: "any",
            scroll_step: 0.1,

            midi: false,

            default_value: _audio_import_settings.minfreq,
            value: _audio_import_settings.minfreq,

            title: "Min. freq.",

            title_min_width: 84,
            value_min_width: 64,

            on_change: function (value) {
                _audio_import_settings.minfreq = value;
            }
        });
    
    WUI_RangeSlider.create("fs_import_audio_maxfreq_settings", {
            width: 100,
            height: 8,

            min: 0,

            bar: false,

            step: "any",
            scroll_step: 0.1,

            midi: false,

            default_value: _audio_import_settings.maxfreq,
            value: _audio_import_settings.maxfreq,

            title: "Max. freq.",

            title_min_width: 84,
            value_min_width: 64,

            on_change: function (value) {
                _audio_import_settings.maxfreq = value;
            }
        });
    
    // initialize collapsable elements
    var collapsibles = document.querySelectorAll(".fs-collapsible"),
        legends,
        i, j;
    for (i = 0; i < collapsibles.length; i += 1) {
        legends = collapsibles[i].getElementsByClassName("fs-collapsible-legend");
        if (legends.length > 0) {
            _applyCollapsible(collapsibles[i], legends[0]);
        }    
    }
    
    // now useless, just safe to remove!
    _utterFailRemove();
};