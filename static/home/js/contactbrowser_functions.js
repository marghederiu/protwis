window.zoomHeatmap = {};
        window.zoomHiveplot = {};

        // create NGL tooltip
        var ngl_tooltip = document.createElement("div")
        Object.assign(ngl_tooltip.style, {
          display: "none",
          position: "fixed",
          zIndex: 10,
          pointerEvents: "none",
          backgroundColor: "rgba( 0, 0, 0, 0.6 )",
          color: "lightgrey",
          padding: "8px",
          fontFamily: "sans-serif"
        })
        document.body.appendChild(ngl_tooltip)

        var is_fullscreen = false;
        function toggleFullScreen(fullScreenElement) {
            if (!document.mozFullScreen && !document.webkitFullScreen) {
                if (fullScreenElement.mozRequestFullScreen) {
                    fullScreenElement.mozRequestFullScreen();
                } else {
                    fullScreenElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                }
            } else {
                if (document.mozCancelFullScreen) {
                  document.mozCancelFullScreen();
                } else {
                  document.webkitCancelFullScreen();
                }
            }
        }

        function hidePopovers() {
            $('.popover').each(function(){
                $(this).remove();
            });
        }

        function HSVtoRGB(h, s, v) {
            var r, g, b, i, f, p, q, t;
            if (arguments.length === 1) {
                s = h.s, v = h.v, h = h.h;
            }
            i = Math.floor(h * 6);
            f = h * 6 - i;
            p = v * (1 - s);
            q = v * (1 - f * s);
            t = v * (1 - (1 - f) * s);
            switch (i % 6) {
                case 0: r = v, g = t, b = p; break;
                case 1: r = q, g = v, b = p; break;
                case 2: r = p, g = v, b = t; break;
                case 3: r = p, g = q, b = v; break;
                case 4: r = t, g = p, b = v; break;
                case 5: r = v, g = p, b = q; break;
            }
            return {
                r: Math.round(r * 255),
                g: Math.round(g * 255),
                b: Math.round(b * 255)
            };
        }

        function rgb2hex(r,g,b) {
            r = Math.round(r).toString(16);
            g = Math.round(g).toString(16);
            b = Math.round(b).toString(16);

            if (r.length == 1)
                r = '0' + r;

            if (g.length == 1)
                g = '0' + g;

            if (b.length == 1)
                b = '0' + b;

            return '#' + r + g + b;
        }

        function getInteractionStrength(i) {
            switch (i.toLowerCase()) {
                case "ionic":
                    return 5;
                case "polar":
                    return 4;
                case "aromatic":
                    return 3;
                case "hydrophobic":
                    return 2;
                case "van-der-waals":
                    return 1;
                default:
                    return 0;
            }
        }

        function getColorStrongestInteraction(interactions, rgb = true) {
            var maxStrength = 0;
            for (var i = 0; i < interactions.length; i++)
              maxStrength = Math.max(maxStrength, getInteractionStrength(interactions[i].replace(/-/g, ' ')));

            return getInteractionColor(maxStrength, rgb);
        }

        function getFrequencyColor(frequency, rgb = true) {
            return getGradientColor(-1*frequency, rgb);
        }

        function getFlareGradientColor(fDiff, rgb = true, hide_zero = true) {
            var color;
            var shift = 80;
            var basal = 255 - shift;
            if (hide_zero && fDiff == 0){
              // to hide zero, make paths completely white.
              return rgb2hex(255, 255, 255);
            }

            if (fDiff <= 0)
                // If fDiff is close to -1, we want a red color
                color = { r: basal + (fDiff * -1*shift), g: basal-basal*(-fDiff), b: basal-basal*(-fDiff) };
            else
                // If fDiff is close to 1 we want a blue color
                color = { r: basal-basal*fDiff, g: basal-basal*fDiff, b: basal + (fDiff * shift)};

            if (rgb)
                return color;
            else
                return rgb2hex(color.r, color.g, color.b);
        }

        function getGradientColor(fDiff, rgb = true){
          var color;
            if (fDiff <= 0)
                // If fDiff is close to -1, we want a red color
                color = { r: 255, g: 255-255*(-fDiff), b: 255-255*(-fDiff) };
            else
                // If fDiff is close to 1 we want a blue color
                color = { r: 255-255*fDiff, g: 255-255*fDiff, b: 255 };

            if (rgb)
                return color;
            else
                return rgb2hex(color.r, color.g, color.b);
        }

        function getStrongestInteractionType(interactions) {
            if ($.inArray('ionic', interactions) > -1)
                return 'ionic';
            else if ($.inArray('polar', interactions) > -1)
                return 'polar';
            else if ($.inArray('aromatic', interactions) > -1)
                return 'aromatic';
            else if ($.inArray('hydrophobic', interactions) > -1)
                return 'hydrophobic';
            else if ($.inArray('van-der-waals', interactions) > -1)
                return 'van-der-waals';

            return 'undefined';
        }

        function getStrongestInteractionTypeFromPdbObject(obj) {

            var interactions = [];

            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    var strongestInteraction = getStrongestInteractionType(obj[key]);
                    interactions.push(strongestInteraction);
                }
            }

            return getStrongestInteractionType(interactions);
        }

        function getInteractionTypesFromPdbObject(obj) {

            var interactions = new Set();
            for (var key in obj) {
              Object.keys(obj[key]).forEach(function(k,index) {
                        interactions.add(obj[key][k]);
              });
                // if (Object.prototype.hasOwnProperty.call(obj, key)) {
                //     for (var k in obj[key])
                //         interactions.add(obj[key][k]);
                // }
            }

            // Sort according to strength - now done by backend
            interactions = Array.from(interactions);
            interactions.sort(function (i1, i2) {
                return  getInteractionStrength(i1) - getInteractionStrength(i2);
            });

            return interactions;
        }


        function getInteractionColor(interaction, rgb = true) {
            var r, g, b;

            value = interaction
            if (isNaN(value))
              value = value.toLowerCase()

            switch (value) {
                case 'ionic':
                case 5:
                    r = 197; g = 66; b = 244;
                    break;
                case 'polar':
                case 4:
                    //r = 254; g = 0; b = 16;
                    r = 255; g = 98; b = 108;
                    break;
                case 'aromatic':
                case 3:
                    //r = 94; g = 241; b = 242;
                    r = 255; g = 166; b = 98;
                    break;
                case 'hydrophobic':
                case 2:
                    //r = 0; g = 117; b = 220;
                    r = 5; g = 200; b = 90;
                    break;
                case 'van-der-waals':
                case 1:
                    //r = 89; g = 252; b = 197;
                    r = 100; g = 100; b = 100;
                    break;
                default:
                    r = 0; g = 0; b = 0;
            }

            if (rgb)
              return { r: r, g: g, b: b };
            else
              return rgb2hex(r, g, b);
        }

        function getFriendlyInteractionName(interaction) {
            /*switch (interaction) {
                case 'polarsidechainsidechaininteraction':
                case 'polarbackbonesidechaininteraction':
                    return 'Polar';
                case 'facetofaceinteraction':
                case 'facetoedgeinteraction':
                case 'picationinteraction':
                    return 'Aromatic';
                case 'hydrophobicinteraction':
                    return 'Hydrophobic';
                case 'vanderwaalsinteraction':
                    return 'Van der Waals';
                default:
                    return 'Unknown';
            }*/
            return interaction;
        }

        /*function getFriendlyInteractionName(interaction) {
            switch (interaction) {
                case 'polarsidechainsidechaininteraction':
                return 'Polar (SC-SC)';
                case 'polarbackbonesidechaininteraction':
                    return 'Polar (BB-SC)';
                case 'facetofaceinteraction':
                  return 'Aromatic (F-F)';
                case 'facetoedgeinteraction':
                  return 'Aromatic (F-E)';
                case 'picationinteraction':
                    return 'Cation - pi';
                case 'hydrophobicinteraction':
                    return 'Hydrophobic';
                case 'vanderwaalsinteraction':
                    return 'Van der Waals';
                default:
                    return 'Unknown';
            }
        }*/

        function getSegmentColor(segmentName) {
            var r, g, b;

            switch (segmentName) {
                case 'N-term':
                case 'C-term':
                    r = 190; g = 190; b = 190;
                    //r = 255; g = 150; b = 150;
                    break;
                case 'TM1':
                case 'TM2':
                case 'TM3':
                case 'TM4':
                case 'TM5':
                case 'TM6':
                case 'TM7':
                case 'H8':
                    r = 230; g = 230; b = 230;
                    //r = 150; g = 255; b = 150;
                    break;
                case 'ECL1':
                case 'ECL2':
                case 'ECL3':
                    r = 190; g = 190; b = 190;
                    //r = 150; g = 150; b = 255;
                    break;
                case 'ICL1':
                case 'ICL2':
                case 'ICL3':
                    r = 190; g = 190; b = 190;
                    //r = 150; g = 150; b = 255;
                    break;
                default:
                    r = 0; g = 0; b = 0;
            }

            return { r: r, g: g, b: b };
        }

        function getAminoAcidOneLetterCode(threeLetterCode) {
            switch (threeLetterCode.toUpperCase()) {
                case 'ALA':
                    return 'A';
                case 'ARG':
                    return 'R';
                case 'ASN':
                    return 'N';
                case 'ASP':
                    return 'D';
                case 'CYS':
                    return 'C';
                case 'GLN':
                    return 'Q';
                case 'GLU':
                    return 'E';
                case 'GLY':
                    return 'G';
                case 'HIS':
                    return 'H';
                case 'ILE':
                    return 'I';
                case 'LEU':
                    return 'L';
                case 'LYS':
                    return 'K';
                case 'MET':
                    return 'M';
                case 'PHE':
                    return 'F';
                case 'PRO':
                    return 'P';
                case 'SER':
                    return 'S';
                case 'THR':
                    return 'T';
                case 'TRP':
                    return 'W';
                case 'TYR':
                    return 'Y';
                case 'VAL':
                    return 'V';
                default:
                    return null;
            }
        }

        function downloadSVG2(svgSelector, name) {
          var svgClone = $(svgSelector).clone();
          svgClone.find('.svg-pan-zoom_viewport').attr('transform', 'matrix(2.2,0,0,2.2,295,140)');

          var escapedSVG = new XMLSerializer().serializeToString(svgClone.get(0));

          downloadURI('data:image/svg+xml;base64,' + window.btoa(escapedSVG), name);
        }

        function downloadSingleCrystalCSV(singleCrystalSvgSelector, name) {
            var data = [];
            var header = ['Residue number 1', 'Residue number 2', 'Segment 1', 'Segment 2',  'Generic number 1', 'Generic number 2', 'Amino acid 1', 'Amino acid 2', 'Interaction type'];
            data.push(header);

            $(singleCrystalSvgSelector + ' rect[data-interaction-type]').each(function(e) {
              var rect = $(this);
              var resNo1 = rect.data('res-no-1');
              var resNo2 = rect.data('res-no-2');
              var seg1 = rect.data('seg-1');
              var seg2 = rect.data('seg-2');
              var genNo1 = rect.data('gen-no-1');
              var genNo2 = rect.data('gen-no-2');
              var aa1 = rect.data('aa-1');
              var aa2 = rect.data('aa-2');
              var iType = rect.data('interaction-type');
              data.push([resNo1, resNo2, seg1, seg2, genNo1, genNo2, aa1, aa2, iType]);
            });

            // Convert to CSV
            var csv = Papa.unparse(data);

            // Download file
            downloadURI('data:text/csv;charset=UTF-8,' + encodeURI(csv), name);
        }

        function downloadSingleCrystalGroupCSV(singleGroupSvgSelector, name) {
            var data = [];
            var header = ['Generic number 1', 'Generic number 2', 'Segment 1', 'Segment 2', 'Frequency',  'Number of interactions', 'Number of crystals'];
            data.push(header);

            $(singleGroupSvgSelector + ' rect[data-frequency]').each(function(e) {
              var rect = $(this);
              var genNo1 = rect.data('gen-no-1');
              var genNo2 = rect.data('gen-no-2');
              var seg1 = rect.data('seg-1');
              var seg2 = rect.data('seg-2');
              var nInteractions = rect.data('num-interactions');
              var nTotalInteractions = rect.data('total-possible-interactions');
              var frequency = rect.data('frequency');
              data.push([genNo1, genNo2, seg1, seg2, nInteractions, nTotalInteractions, frequency]);
            });

            // Convert to CSV
            var csv = Papa.unparse(data);

            // Download file
            downloadURI('data:text/csv;charset=UTF-8,' + encodeURI(csv), name);
        }

        function downloadTwoCrystalGroupsCSV(twoGroupsSvgSelector, name) {
            var data = [];
            var header = ['Generic number 1', 'Generic number 2', 'Segment 1', 'Segment 2', 'Interactions group 1', 'Interactions group 2', 'Crystals group 1', 'Crystals group 2', 'Frequency group 1', 'Frequency group 2', 'Frequency Difference'];
            data.push(header);

            $(twoGroupsSvgSelector + ' rect[data-frequency-diff]').each(function(e) {
              var rect = $(this);
              var genNo1 = rect.data('gen-no-1');
              var genNo2 = rect.data('gen-no-2');
              var seg1 = rect.data('seg-1');
              var seg2 = rect.data('seg-2');
              var numIntsGroup1 = rect.data('group-1-num-ints');
              var numIntsGroup2 = rect.data('group-2-num-ints');
              var numPdbsGroup1 = rect.data('group-1-num-pdbs');
              var numPdbsGroup2 = rect.data('group-2-num-pdbs');
              var freqGroup1 = rect.data('group-1-freq');
              var freqGroup2 = rect.data('group-2-freq');
              var fDiff = rect.data('frequency-diff').toFixed(2);
              data.push([genNo1, genNo2, seg1, seg2, numIntsGroup1, numIntsGroup2, numPdbsGroup1, numPdbsGroup2, freqGroup1, freqGroup2, fDiff]);
            });

            // Convert to CSV
            var csv = Papa.unparse(data);

            // Download file
            downloadURI('data:text/csv;charset=UTF-8,' + encodeURI(csv), name);
        }

        function downloadURI(uri, name) {
            var link = document.createElement("a");
            link.download = name;
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            delete link;
        }

        function renderHeatmap(data, heatMapSelector) {

            var start = new Date().getTime();
            // Destroy old zoom on heatmap
            if (window.zoomHeatmap[heatMapSelector] != null) {
                window.zoomHeatmap[heatMapSelector].destroy();
                delete window.zoomHeatmap[heatMapSelector];
            }

            var end = new Date().getTime();
            // console.log('Remove old zoom',end-start);

            // Destroy old legend content
            // $(heatMapSelector + ' .heatmap-legend').empty();

            // Destroy all previous contents
            var heatmap_id = $(heatMapSelector + ' .heatmap').attr("id");
            $("#"+heatmap_id+"_content").remove();
            $(heatMapSelector + ' .heatmap-interaction').remove();
            $(heatMapSelector + ' .heatmap').empty();
            var heatmap = Snap(heatMapSelector + ' .heatmap');
            var heatmap_id = $(heatMapSelector + ' .heatmap').attr("id");
            console.log('ID is',heatmap_id,'from',heatMapSelector);

            if (data.length == 3) {
              data1 = data[0];
              data2 = data[1];
              data3 = data[2];
              var interactions = data3.interactions;
              var segment_map = data3.segment_map;
              var sequence_numbers = data3.sequence_numbers;
              var num_seq_numbers = Object.keys(data3.sequence_numbers).length;
            } else {
              // Draw heatmap
              var interactions = data.interactions;
              var segment_map = data.segment_map;
              var sequence_numbers = data.sequence_numbers;
              var aa_map = data.aa_map[Object.keys(data.aa_map)[0]];
              var gen_map = data.generic_map;
              var num_seq_numbers = Object.keys(data.sequence_numbers).length;

              var pdbs = data.pdbs;
              var pdbs1 = data.pdbs1;
              var pdbs2 = data.pdbs2;
            }
            x = 0; wi = num_seq_numbers;
            y = 0; hi = num_seq_numbers;

            heatmap.attr({viewBox:[x,y,wi,hi].join(',')});
            heatmap.attr({viewBox:[x,y,wi,hi].join(' ')});

            // Contains all labels
            var labelGroup = heatmap.g();

            // Contains all content
            var contentGroup = heatmap.g();
            contentGroup.attr('id',heatmap_id+'_content');

            // Compute segment offsets
            var i;

            var segments = [];

            var seg, prevSeg = segment_map[sequence_numbers[0]];
            var seqStart = 0;

            for (i = 0; i < num_seq_numbers; i++) {
                seg = segment_map[sequence_numbers[i]];

                if (seg === prevSeg) {
                    continue;
                }

                segments.push({
                    seg: prevSeg,
                    start: seqStart,
                    end: i-1
                });

                seqStart = i;
                prevSeg = seg;
            }

            // Push last segment
            segments.push({
                seg: prevSeg,
                start: seqStart,
                end: i-1
            });

            // Determine font-size
            label_font_size = Math.round(1*num_seq_numbers/20);
            label_font_size = "5";
            console.log(num_seq_numbers,'num_seq_numbers',label_font_size);

            lines = Array();
            // Draw segments
            last_end = 0
            segments.forEach(function(s) {
                var rgb = getSegmentColor(s.seg);
                // Place the segments vertically.
                var cell = heatmap.rect(s.start, 0, s.end - s.start + 1, 0);
                var line = heatmap.line(s.start, 0, s.start, num_seq_numbers);
                last_end = s.end;
                cell.attr({
                    'fill': "rgb(" + [rgb.r, rgb.g, rgb.b].join(',') + ")",
                    // 'fill': "#FFFFFF",
                    'fill-opacity': "0.5"
                });

                line.attr({
                    'stroke': "rgb(150,150,150)",
                    'strokeWidth': "0.1"
                });


                // Add text
                var label = heatmap.text(s.start + (s.end - s.start + 1)/2 - label_font_size, -1 + cell.getBBox().height, s.seg);
                label.attr({
                    'text-anchor': 'start',
                    'font-size': label_font_size
                });

                // contentGroup.add(cell);
                lines.push(line);
                labelGroup.add(label);

                // label.transform("r270s-1,1");
            });

                var line = heatmap.line(last_end+1, 0, last_end+1, num_seq_numbers);
                line.attr({
                    'stroke': "rgb(150,150,150)",
                    'strokeWidth': "0.1"
                });
                lines.push(line);
                var line = heatmap.line(0, 0,  num_seq_numbers, 0);
                line.attr({
                    'stroke': "rgb(150,150,150)",
                    'strokeWidth': "0.1"
                });
                lines.push(line);

            segments.forEach(function(s) {
                rgb = getSegmentColor(s.seg);

                // Place the segments horizontally.
                cell = heatmap.rect(0, s.start, num_seq_numbers, s.end - s.start + 1);
                line = heatmap.line(0, s.end+1, num_seq_numbers, s.end+1);

                cell.attr({
                    'fill': "rgb(" + [rgb.r, rgb.g, rgb.b].join(',') + ")",
                    // 'fill': "#FFFFFF",
                    'fill-opacity': "0.5"
                });

                line.attr({
                    'stroke': "rgb(150,150,150)",
                    'strokeWidth': "0.1"
                });

                var label = heatmap.text(-1, 1+s.start + (s.end - s.start)/2, s.seg);

                label.attr({
                    'text-anchor': 'end',
                    'font-size': label_font_size,
                    'alignment-baseline': 'middle'
                });

                // label.transform("r270");

                contentGroup.add(cell);
                lines.push(line);
                labelGroup.add(label);
            });
            // console.log('segments drawn')
            var start = new Date().getTime();
            cells = Array();
            rects = Array();
            // Draw cells
            var svgns = "http://www.w3.org/2000/svg";
            // console.log(relevant_interactions);
            if (data.length == 3){
              heatmap_mode = 'two_groups';
            } else if (pdbs.length==1) {
              heatmap_mode = 'single';
            } else if (pdbs.length>1) {
              heatmap_mode = 'single_group';
            } 
            console.log(heatmap_mode,'pdbs',pdbs,'pdbs1',pdbs1,'pdbs2',pdbs2);
            for (i = 0; i < num_seq_numbers; i++) {
                for (var j = 0; j < num_seq_numbers; j++) {

                    if (heatmap_mode=='two_groups') { 
                      var seq_i = data3.sequence_numbers[i];
                      var seq_j = data3.sequence_numbers[j];

                      // Only draw if an interaction exists
                      var num = seq_i + "," + seq_j;
                      var num2 = seq_j + "," + seq_i;

                      if (num2 in interactions) num = num2;

                      var n1 = 0;
                      var n2 = 0;

                      if (num in data1.interactions) {
                          n1 = Object.keys(data1.interactions[num]).length;
                      }

                      if (num in data2.interactions) {
                          n2 = Object.keys(data2.interactions[num]).length;
                      }

                      if ((num in data1.interactions) || (num in data2.interactions)) {
                        // Difference in frequencies
                        var f1 = (n1 / data1.pdbs.length);
                        var f2 = (n2 / data2.pdbs.length);
                        var fDiff = (n1 / data1.pdbs.length) - (n2 / data2.pdbs.length);

                        var rgb = getGradientColor(fDiff, true);

                        var rect = document.createElementNS(svgns, 'rect');
                            rect.setAttributeNS(null, 'x', i);
                            rect.setAttributeNS(null, 'y', j);
                            rect.setAttributeNS(null, 'height', '1');
                            rect.setAttributeNS(null, 'width', '1');

                        var title =  'Residues ' + seq_i + ', ' + seq_j + '<br />'
                                   + 'Frequency group 1: ' + f1.toFixed(2)+ '<br />'
                                   + 'Frequency group 2: ' + f2.toFixed(2)+ '<br />'
                                   + 'Frequency difference: ' + fDiff.toFixed(2)+ '<br />' ;

                        var popoverTable = '<table class="table">'
                            + '<thead>'
                            + '<tr>'
                            + '<th>Residue #</th>'
                            + '<th>' + seq_i + '</th>'
                            + '<th>' + seq_j + '</th>'
                            + '</tr>'
                            + '</thead>'
                            + '<tbody>'
                            + '<td>Segment</td>'
                            + '<td>' + segment_map[seq_i] + '</td>'
                            + '<td>' + segment_map[seq_j] + '</td>'
                            + '</tr>'
                            + '</tbody>'
                            + '</table>'
                            + 'Group 1 freq: ' + f1.toFixed(2) + '<br />'
                            + 'Group 2 freq: ' + f2.toFixed(2) + '<br />'
                            + 'Frequency difference: ' + fDiff.toFixed(2)

                        rect.setAttributeNS(null, 'fill', "rgb(" + [rgb.r, rgb.g, rgb.b].join(',') + ")");
                        rect.setAttributeNS(null, 'class', "heatmap-interaction");
                        rect.setAttributeNS(null, 'title', "Interaction between " + seq_i + ", " + seq_j);
                        rect.setAttributeNS(null, 'data-content', popoverTable);
                        rect.setAttributeNS(null, 'data-frequency-diff', fDiff.toFixed(2));
                        rect.setAttributeNS(null, 'data-gen-no-1', seq_i);
                        rect.setAttributeNS(null, 'data-gen-no-2', seq_j);
                        document.getElementById(heatmap_id).appendChild(rect);
                      }
                    } else {

                    // Get the sequence numbers
                    var seq_i = data.sequence_numbers[i];
                    var seq_j = data.sequence_numbers[j];

                    // Only draw if an interaction exists
                    var num = seq_i + "," + seq_j;
                    var num2 = seq_j + "," + seq_i;

                    if (num2 in interactions) num = num2;

                    // console.log(num,'num of freq',interactions.length);
                    if (num in interactions) {

                        if (heatmap_mode=='single') { 
                          getInteractionTypesFromPdbObject(interactions[num]).forEach(function(interaction) {
                            var rgb = getInteractionColor(interaction);
                            // var cell = heatmap.rect(i, j, 1, 1);

                            var rect = document.createElementNS(svgns, 'rect');
                            rect.setAttributeNS(null, 'x', i);
                            rect.setAttributeNS(null, 'y', j);
                            rect.setAttributeNS(null, 'height', '1');
                            rect.setAttributeNS(null, 'width', '1');

                            var interactionsString = getInteractionTypesFromPdbObject(interactions[num]).map(getFriendlyInteractionName).filter(function(item, pos, self) {
                                return self.indexOf(item) == pos;
                            }).join(", ");

                            var content, title = 'Residues ' + aa_map[seq_i] + seq_i + '-' + aa_map[seq_j] + seq_j + '<br />'
                                    + 'Interactions: ' + interactionsString + '<br />'
                                    + 'Segments: ' + segment_map[seq_i] + ', ' + segment_map[seq_j] + '<br />';

                            // Add generic numbers where applicable
                            if (seq_i in gen_map) {
                                title += 'Res. 1 gen. no: ' + gen_map[seq_i] + '<br />';
                            }

                            if (seq_j in gen_map) {
                                title += 'Res. 2 gen. no: ' + gen_map[seq_j] + '<br />';
                            }

                            var genStrI = gen_map[seq_i];
                            var genStrJ = gen_map[seq_j];

                            if (typeof gen_map[seq_i] == 'undefined') {
                                genStrI = '-';
                            }

                            if (typeof gen_map[seq_j] == 'undefined') {
                                genStrJ = '-';
                            }

                            var popoverTable = '<table class="table">'
                            + '<thead>'
                            + '<tr>'
                            + '<th>Residue</th>'
                            + '<th>' + aa_map[seq_i] + seq_i + '</th>'
                            + '<th>' + aa_map[seq_j] + seq_j + '</th>'
                            + '</tr>'
                            + '</thead>'
                            + '<tbody>'
                            + '<td>Segment</td>'
                            + '<td>' + segment_map[seq_i] + '</td>'
                            + '<td>' + segment_map[seq_j] + '</td>'
                            + '</tr>'
                            + '<tr>'
                            + '<td>Gen. no.</td>'
                            + '<td>' + genStrI + '</td>'
                            + '<td>' + genStrJ + '</td>'
                            + '</tr>'
                            + '</tbody>'
                            + '</table>'
                            + '<table class="table">'
                            + '<thead>'
                            + '<tr>'
                            + '<th>Interactions</th>'
                            + '</tr>'
                            + '<tr>'
                            + '</thead>'
                            + '<tbody>'
                            + '<tr>'
                            + '<td>' + interactionsString + '</td>'
                            + '</tr>'
                            + '</tbody>'
                            + '</table>';

                            rect.setAttributeNS(null, 'fill', "rgb(" + [rgb.r, rgb.g, rgb.b].join(',') + ")");
                            rect.setAttributeNS(null, 'class', "heatmap-interaction");
                            rect.setAttributeNS(null, 'title', "Interaction between " + seq_i + ", " + seq_j);
                            rect.setAttributeNS(null, 'data-content', popoverTable);
                            rect.setAttributeNS(null, 'data-res-no-1', seq_i);
                            rect.setAttributeNS(null, 'data-res-no-2', seq_j);
                            rect.setAttributeNS(null, 'data-gen-no-1', genStrI);
                            rect.setAttributeNS(null, 'data-gen-no-2', genStrJ);
                            rect.setAttributeNS(null, 'data-interaction-type', interaction);
                            document.getElementById(heatmap_id).appendChild(rect);
                          });

                        } else if (heatmap_mode=='single_group') {
                          var rect = document.createElementNS(svgns, 'rect');
                          rect.setAttributeNS(null, 'x', i);
                          rect.setAttributeNS(null, 'y', j);
                          rect.setAttributeNS(null, 'height', '1');
                          rect.setAttributeNS(null, 'width', '1');

                          var nInteractions = Object.keys(interactions[num]).length;
                          var frequency = nInteractions / data.pdbs.length;

                          var rgb = { r: 255, g: Math.round(255-frequency*255), b: Math.round(255-frequency*255) };

                          var popoverTable = '<table class="table">'
                          + '<thead>'
                          + '<tr>'
                          + '<th>Residue #</th>'
                          + '<th>' + seq_i + '</th>'
                          + '<th>' + seq_j + '</th>'
                          + '</tr>'
                          + '</thead>'
                          + '<tbody>'
                          + '<td>Segment</td>'
                          + '<td>' + segment_map[seq_i] + '</td>'
                          + '<td>' + segment_map[seq_j] + '</td>'
                          + '</tr>'
                          + '</tbody>'
                          + '</table>'
                          + 'Interaction count: ' + nInteractions + '<br />'
                          + 'Interaction frequency: ' + frequency.toFixed(2)


                          rect.setAttributeNS(null, 'fill', "rgb(" + [rgb.r, rgb.g, rgb.b].join(',') + ")");
                          rect.setAttributeNS(null, 'class', "heatmap-interaction");
                          rect.setAttributeNS(null, 'title', "Interaction between " + seq_i + ", " + seq_j);
                          rect.setAttributeNS(null, 'data-content', popoverTable);
                          rect.setAttributeNS(null, 'data-gen-no-1', seq_i);
                          rect.setAttributeNS(null, 'data-gen-no-2', seq_j);
                          rect.setAttributeNS(null, 'data-frequency', frequency);
                          // rect.setAttributeNS(null, 'data-extra', JSON.stringify(interactions[num][2]));
                          document.getElementById(heatmap_id).appendChild(rect);
                        }

                    }
                  }
                }
            }

            // Start new g() here so it comes on top of cells
            var contentLines = heatmap.g();
            contentLines.add(lines);
            contentLines.add(labelGroup);

            var end = new Date().getTime();

            $(heatMapSelector + ' rect.heatmap-interaction').click(function() {
              // alert( "Handler for .click() called." );
                var $this = $(this);
                //if not already initialized
                if (!$this.data('bs.popover')) {
                  $this.popover({
                    'container': heatMapSelector,
                    'placement': 'bottom',
                    'animation': true,
                    'html': true,
                    'tabindex': '0'
                  }).popover('show');
                }
            });


            var end2 = new Date().getTime();


            // // Make zoomable
            window.zoomHeatmap[heatMapSelector] = svgPanZoom(heatMapSelector + ' .heatmap', {
                zoomEnabled: true,
                // controlIconsEnabled: true,
                fit: true,
                center: true,
                minZoom: 0.75,
                maxZoom: 50,
                zoomScaleSensitivity: 0.25,
                dblClickZoomEnabled: true,
                beforeZoom: hidePopovers,
                beforePan: hidePopovers
            });

            // // Set initial zoom level

            // Close popovers on clicking elsewhere
            $('html').on('mousedown', function(e) {
                if(!$(e.target).closest('.popover').length) {
                    if ($(e.target).closest(heatMapSelector).length) {
                        hidePopovers();
                    }
                }
            });
            old_heatmap_width = 0;

        }


        

        var filtered_gn_pairs = [];
        function filter_browser() {
          old_filtered_gn_pairs = filtered_gn_pairs;
          filtered_gn_pairs = [];
          $('.filter_rows:visible').each(function() {
            filtered_gn_pairs.push($(this).attr('id'))
          });
          console.log('filtered positions!',filtered_gn_pairs);
          
          if(old_filtered_gn_pairs.sort().join(',')=== filtered_gn_pairs.sort().join(',')){
            console.log('no change in filtering');
          } else {
            updateGeneralControls();
          }
        }

        function renderBrowser(data) {
          var selector = $('ul#mode_nav').find('li.active').find('a').attr("href");
          console.log('GOT DATA',selector);
          var table = $(selector + " .browser-table");
          // reset tbody
          table.prop("onclick", null).off("click");

          // var tbody = table.find('tbody'); 
          // tbody.empty();
          if ($.fn.DataTable.isDataTable(selector + " .browser-table")) {
            table.DataTable().destroy();
          }
          // yadcf.removeFilters(table);
          table.parent().html('<table class="browser-table compact cell-border" width="2000px" style2="margin-left:0px" style="margin:0 auto"><thead></thead><tbody></tbody></table>');
          var table = $(selector + " .browser-table");
          // table.parent().before('<span><button type="button" onclick="filter_browser(this);" class="btn btn-xs btn-primary reset-selection">Filter</button></span>');
          var tbody = table.find('tbody'); 
          // table.DataTable().clear();
          if (data['proteins2']) {

            thead =  '<tr> \
                          <th colspan="1">Segment</th> \
                          <th colspan="1">Generic No</th> \
                          <th colspan="3"> Frequency (%)</th> \
                          <th>Type(s)</th> \
                          <th>Class Seq Cons(%)</th> \
                          <th>Ca distance</th> \
                          <th colspan="2">Ca distance from<br> 7TM axis</th> \
                          <th colspan="2">Backbone Rotation</th> \
                          <th colspan="2">Residue Rotamer</th> \
                          <th colspan="2">Tau angle</th> \
                          <th colspan="2">Phi dihedral</th> \
                          <th colspan="2">Psi dihedral</th> \
                        </tr> \
                        <tr> \
                          <th class="dt-center"></th> \
                          <th class="dt-center"></th> \
                          <th class="narrow_col">Set 1<br></th> \
                          <th class="narrow_col">Set 2<br></th> \
                          <th class="narrow_col">Diff<br></th> \
                          <th></th> \
                          <th class="narrow_col">AA pairs</th> \
                          <th class="narrow_col">Res1-Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                        </tr>';
            table.find('thead').html(thead); 
            // two groups
            var proteins_1 = data['proteins1'].length
            var proteins_2 = data['proteins2'].length
            var pdbs_1 = data['pdbs1'].length
            var pdbs_2 = data['pdbs2'].length
            $.each(data['interactions'], function (i, v) {
              var gn1 = i.split(",")[0]
              var gn2 = i.split(",")[1]
              var pfreq1 = Math.round(100*v['proteins1'].length / proteins_1);
              var pfreq2 = Math.round(100*v['proteins2'].length / proteins_2);
              var diff_pfreq = pfreq1-pfreq2;
              var sfreq1 = Math.round(100*v['pdbs1'].length / pdbs_1);
              var sfreq2 = Math.round(100*v['pdbs2'].length / pdbs_2);
              var diff_sfreq = sfreq1-sfreq2;
              var class_seq_cons = v['class_seq_cons'];
              var types = v['types'].join(",<br>");
              var seg1 = data['segm_lookup'][gn1];
              var seg2 = data['segm_lookup'][gn2];
              var distance = v['distance'];
              var angles_1 = v['angles'][0];
              var angles_2 = v['angles'][1];
              tr = `
                    <tr class="clickable-row filter_rows" id="${i}">
                      <td class="dt-center">${seg1}-${seg2}</td>
                      <td class="dt-center">${gn1}-${gn2}</td>
                      <td class="narrow_col">${sfreq1}</td>
                      <td class="narrow_col">${sfreq2}</td>
                      <td class="narrow_col">${diff_sfreq}</td>
                      <td>${types}</td>
                      <td class="narrow_col">${class_seq_cons}</td>
                      <td class="narrow_col">${distance}</td>
                      <td class="narrow_col">${angles_1[0]}</td>
                      <td class="narrow_col">${angles_2[0]}</td>
                      <td class="narrow_col">${angles_1[1]}</td>
                      <td class="narrow_col">${angles_2[1]}</td>
                      <td class="narrow_col">${angles_1[2]}</td>
                      <td class="narrow_col">${angles_2[2]}</td>
                      <td class="narrow_col">${angles_1[3]}</td>
                      <td class="narrow_col">${angles_2[3]}</td>
                      <td class="narrow_col">${angles_1[4]}</td>
                      <td class="narrow_col">${angles_2[4]}</td>
                      <td class="narrow_col">${angles_1[5]}</td>
                      <td class="narrow_col">${angles_2[5]}</td>
                    </tr>`;
              tbody.append(tr);
            }); 
          } else if (data['proteins'].length>1) {
            thead =  '<tr> \
                          <th colspan="1">Segment</th> \
                          <th colspan="1">Generic No</th> \
                          <th> Frequency (%)</th> \
                          <th>Type(s)</th> \
                          <th>Class Seq Cons(%)</th> \
                          <th>Ca distance</th> \
                          <th colspan="2">Ca distance from 7TM<br>axis</th> \
                          <th colspan="2">Backbone<br>Rotation</th> \
                          <th colspan="2">Residue<br>Rotamer</th> \
                          <th colspan="2">Tau angle</th> \
                          <th colspan="2">Phi dihedral</th> \
                          <th colspan="2">Psi dihedral</th> \
                        </tr> \
                        <tr> \
                          <th class="dt-center"></th> \
                          <th class="dt-center"></th> \
                          <th class="narrow_col"></th> \
                          <th></th> \
                          <th class="narrow_col">AA pairs</th> \
                          <th class="narrow_col">Res1-Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                        </tr>';
            table.find('thead').html(thead); 
            var proteins = data['proteins'].length
            var pdbs = data['pdbs'].length
            $.each(data['interactions'], function (i, v) {
              var gn1 = i.split(",")[0]
              var gn2 = i.split(",")[1]
              var pfreq = Math.round(100*v['proteins'].length / proteins);
              var sfreq = Math.round(100*v['pdbs'].length / pdbs);
              var types = v['types'].join(",<br>");
              var class_seq_cons = v['class_seq_cons'];
              var seg1 = data['segm_lookup'][gn1];
              var seg2 = data['segm_lookup'][gn2];
              var distance = v['distance'];
              var angles_1 = v['angles'][0];
              var angles_2 = v['angles'][1];
              tr = `
                    <tr class="clickable-row filter_rows" id="${i}">
                      <td class="dt-center">${seg1}-${seg2}</td>
                      <td class="dt-center">${gn1}-${gn2}</td>
                      <td class="narrow_col">${sfreq}</td>
                      <td>${types}</td>
                      <td class="narrow_col">${class_seq_cons}</td>
                      <td class="narrow_col">${distance}</td>
                      <td class="narrow_col">${angles_1[0]}</td>
                      <td class="narrow_col">${angles_2[0]}</td>
                      <td class="narrow_col">${angles_1[1]}</td>
                      <td class="narrow_col">${angles_2[1]}</td>
                      <td class="narrow_col">${angles_1[2]}</td>
                      <td class="narrow_col">${angles_2[2]}</td>
                      <td class="narrow_col">${angles_1[3]}</td>
                      <td class="narrow_col">${angles_2[3]}</td>
                      <td class="narrow_col">${angles_1[4]}</td>
                      <td class="narrow_col">${angles_2[4]}</td>
                      <td class="narrow_col">${angles_1[5]}</td>
                      <td class="narrow_col">${angles_2[5]}</td>
                    </tr>`;
              tbody.append(tr);
            });
          } else {
            thead =  '<tr> \
                          <th colspan="1">Segment</th> \
                          <th colspan="1">Res No</th> \
                          <th colspan="1">Generic No</th> \
                          <th>Interaction</th> \
                          <th>Class Seq Cons(%)</th> \
                          <th>Ca distance</th> \
                          <th colspan="2">Ca distance from 7TM axis</th> \
                          <th colspan="2">Backbone<br>Rotation</th> \
                          <th colspan="2">Residue<br>Rotamer</th> \
                          <th colspan="2">Tau angle</th> \
                          <th colspan="2">Phi dihedral</th> \
                          <th colspan="2">Psi dihedral</th> \
                        </tr> \
                        <tr> \
                          <th class="dt-center"></th> \
                          <th class="dt-center"></th> \
                          <th class="dt-center"></th> \
                          <th></th> \
                          <th class="narrow_col">AA pairs</th> \
                          <th class="narrow_col">Res1-Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                          <th class="narrow_col">Res1</th> \
                          <th class="narrow_col">Res2</th> \
                        </tr>';
            table.find('thead').html(thead); 
            $.each(data['interactions'], function (i, v) {
              var gn1 = i.split(",")[0]
              var gn2 = i.split(",")[1]
              var seg1 = data['segm_lookup'][gn1];
              var seg2 = data['segm_lookup'][gn2];
              var types = v['types'].join(",<br>");
              var pos1 = v['seq_pos'][0];
              var pos2 = v['seq_pos'][1];
              var class_seq_cons = v['class_seq_cons'];
              var seg1 = data['segm_lookup'][gn1];
              var seg2 = data['segm_lookup'][gn2];
              var distance = v['distance'];
              var angles_1 = v['angles'][0];
              var angles_2 = v['angles'][1];
              tr = `
                    <tr class="clickable-row filter_rows" id="${pos1},${pos2}">
                      <td class="dt-center">${seg1}-${seg2}</td>
                      <td class="dt-center"><span>${pos1}</span>-<span>${pos2}</span></td>
                      <td class="dt-center">${gn1}-${gn2}</td>
                      <td>${types}</td>
                      <td class="narrow_col">${class_seq_cons}</td>
                      <td class="narrow_col">${distance}</td>
                      <td class="narrow_col">${angles_1[0]}</td>
                      <td class="narrow_col">${angles_2[0]}</td>
                      <td class="narrow_col">${angles_1[1]}</td>
                      <td class="narrow_col">${angles_2[1]}</td>
                      <td class="narrow_col">${angles_1[2]}</td>
                      <td class="narrow_col">${angles_2[2]}</td>
                      <td class="narrow_col">${angles_1[3]}</td>
                      <td class="narrow_col">${angles_2[3]}</td>
                      <td class="narrow_col">${angles_1[4]}</td>
                      <td class="narrow_col">${angles_2[4]}</td>
                      <td class="narrow_col">${angles_1[5]}</td>
                      <td class="narrow_col">${angles_2[5]}</td>
                    </tr>`;
              tbody.append(tr);
            });
          }

          // table.on('click', '.clickable-row', function(event) {
          //   if($(this).hasClass('active')){
          //     $(this).removeClass('active'); 
          //     $(selector + " .secondary-table").find('tbody').empty();
          //   } else {
          //     $(this).addClass('active').siblings().removeClass('active');
          //     renderSecondary($(this).attr('id'))
          //   }
          // });

          // Create grey scale of values.
          var cols = []
          var trs = table.find("tbody tr")
          var maxmin_data =$.each(trs , function(index, tr){
            $.each($(tr).find("td").not(":first"), function(index, td){
              cols[index] = cols[index] || [];
              cols[index].push($(td).text())
            })
          });
          cols.forEach(function(col, index){
            var max = Math.max.apply(null, col);
            var min = Math.min.apply(null, col);
            if (!(isNaN(max) || isNaN(min))) {
              trs.find('td:eq('+(index+1)+')').each(function(i, td){
                value = parseFloat($(td).text());
                if (!(isNaN(value))) {
                  scale = 1-(value-min)/(max-min);
                  frequency = 0.5-(scale/-2.1)*.5;
                  frequency = 0.5-scale*.5;
                  // console.log(value,min,max,scale,frequency);
                  var rgb = { r: 255-frequency*255, g: 255-frequency*255, b: 255-frequency*255 };
                  var hex = rgb2hex(rgb.r, rgb.g, rgb.b);
                  $(td).attr('bgcolor',hex);
                }
              })
            }
          })

          btable = table.DataTable({
                'scrollX': true,
                // 'paging': true,
                // 'autoWidth': true,

                scrollY:        '50vh',
                // scrollCollapse: true,
                paging:         false,
                "order": [],
                columnDefs: [ { type: "string", targets: 1 } ]
              });

          if (data['proteins2']) {
            yadcf.init(btable,
                      [
                          {
                              column_number : 0,
                              filter_type: "text",
                              // exclude: true,
                              filter_delay: 500,
                              filter_reset_button_text: false,
                          },
                          {
                              column_number : 1,
                              filter_type: "multi_select",
                              select_type: 'select2',
                              select_type_options: {
                                  width: '60px'
                              },
                              filter_default_label: "Res.",
                              text_data_delimiter: "-",
                              filter_reset_button_text: false,
                          },
                          {
                              column_number : 2,
                              filter_type: "range_number",
                              filter_reset_button_text: false,
                          },
                          {
                              column_number : 3,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 4,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 5,
                              filter_type: "multi_select",
                              select_type: 'select2',
                              filter_default_label: "Type",
                              text_data_delimiter: ",",
                              filter_reset_button_text: false,
                          },
                          {
                              column_number : 6,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 7,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 8,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 9,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 10,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 11,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 12,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 13,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 14,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 15,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 16,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 17,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 18,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 19,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                      ],
                      {
                          cumulative_filtering: false
                      }

                  );
          } else if (data['proteins'].length>1) {
            yadcf.init(btable,
                      [
                          {
                              column_number : 0,
                              filter_type: "text",
                              // exclude: true,
                              filter_delay: 500,
                              filter_reset_button_text: false,
                          },
                          {
                              column_number : 1,
                              filter_type: "multi_select",
                              select_type: 'select2',
                              filter_default_label: "Res.",
                              text_data_delimiter: "-",
                              filter_reset_button_text: false,
                          },
                          {
                              column_number : 2,
                              filter_type: "range_number",
                              filter_reset_button_text: false,
                          },
                          {
                              column_number : 3,
                              filter_type: "multi_select",
                              select_type: 'select2',
                              filter_default_label: "Type",
                              text_data_delimiter: ",",
                              filter_reset_button_text: false,
                          },
                          {
                              column_number : 4,
                              filter_type: "range_number",
                              filter_reset_button_text: false,
                          },
                          {
                              column_number : 5,
                              filter_type: "range_number",
                              filter_reset_button_text: false,
                          },
                          {
                              column_number : 6,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 7,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 8,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 9,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 10,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 11,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 12,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 13,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 14,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 15,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 16,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 17,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                      ],
                      {
                          cumulative_filtering: false
                      }

                  );
          } else if (data['proteins'].length==1) {
                // function myCustomFilterFunction(filterVal, columnVal) {
                //     var found;
                //     if (columnVal === '') {
                //         return true;
                //     }
                //     switch (filterVal) {
                //     case 'happy':
                //         found = columnVal.search(/:-\]|:\)|Happy|JOY|:D/g);
                //         break;
                //     case 'sad':
                //         found = columnVal.search(/:\(|Sad|:'\(/g);
                //         break;
                //     case 'angry':
                //         found = columnVal.search(/!!!|Arr\.\.\./g);
                //         break;
                //     case 'lucky':
                //         found = columnVal.search(/777|Bingo/g);
                //         break;
                //     case 'january':
                //         found = columnVal.search(/01|Jan/g);
                //         break;
                //     default:
                //         found = 1;
                //         break;
                //     }
             
                //     if (found !== -1) {
                //         return true;
                //     }
                //     return false;
                // }

            yadcf.init(btable,
                      [
                          {
                              column_number : 0,
                              filter_type: "text",
                              // exclude: true,
                              filter_delay: 500,
                              filter_reset_button_text: false,
                          },
                          {    
                              column_number: 1,
                              filter_type: "multi_select",
                              select_type: 'select2',
                              // column_data_type: "html",
                              select_type_options: {
                                  width: '60px'
                              },
                              html_data_type: "text",
                              text_data_delimiter: "-",
                              filter_default_label: "Res. No.",
                              filter_reset_button_text: false // hide yadcf reset button
                          },
                          {
                              column_number : 2,
                              filter_type: "multi_select",
                              select_type: 'select2',
                              select_type_options: {
                                  width: '60px'
                              },
                              filter_default_label: "Res. Gn.",
                              text_data_delimiter: "-",
                              filter_reset_button_text: false,
                          },
                          {
                              column_number : 3,
                              filter_type: "multi_select",
                              select_type: 'select2',
                              select_type_options: {
                                  width: '60px'
                              },
                              filter_default_label: "Type",
                              text_data_delimiter: ",<br>",
                              filter_reset_button_text: false,
                          },
                          {
                              column_number : 4,
                              filter_type: "range_number",
                              filter_reset_button_text: false,
                          },
                          {
                              column_number : 5,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 6,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 7,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 8,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 9,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 10,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 11,
                              filter_type: "range_number",
                              filter_reset_button_text: false,
                          },
                          {
                              column_number : 12,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 13,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 14,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 15,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 16,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                          {
                              column_number : 17,
                              filter_type: "range_number",
                              filter_reset_button_text: false,

                          },
                      ],
                      {
                          cumulative_filtering: false
                      }

                  );
          }
          btable.on('draw.dt', function(e, oSettings) {
              filter_browser();
          });

        }

        function redraw_renders() {
          // Makes sure diagrams fit sizes
          console.log('redraw renders');
          var visible_svg = $('svg:visible');
          var svg_class = visible_svg.attr("class");
          if( window.innerHeight == screen.height || is_fullscreen) {
              // browser is fullscreen
              console.log('dont redraw in full screen', is_fullscreen);

              if (svg_class=='flareplot') {
                $("svg.flareplot").css('height',screen.height);
              } else {
                visible_svg.css('height',screen.height);
              }

              return
          }


          $('div.dataTables_scrollBody:visible').height('50vh');

          var width_svg = visible_svg.width();

          // Don't go too high
          if (width_svg>screen.height) width_svg = screen.height;
          width_svg = 500;
          visible_svg.height(width_svg);

          // Resize NGL
          var ngl = $('.ngl-container:visible');
          var width_ngl = ngl.width();

          // Don't go too high
          if (width_ngl>screen.height) width_ngl = screen.height;
          ngl.height(width_svg);

          console.log('redraw',svg_class,width_svg,screen.height);

          if (svg_class=='heatmap') {
            // If heatmap being resized, reset zoom

              // Destroy old zoom on heatmap
            var heatMapSelector = "#" + $('.main_option:visible').attr('id');
            heatMapSelector = heatMapSelector+ ' .heatmap-container';
            if (window.zoomHeatmap[heatMapSelector] != null) {
              window.zoomHeatmap[heatMapSelector].destroy();
              delete window.zoomHeatmap[heatMapSelector];

              window.zoomHeatmap[heatMapSelector] = svgPanZoom(heatMapSelector + ' .heatmap', {
                    zoomEnabled: true,
                    // controlIconsEnabled: true,
                    fit: true,
                    center: true,
                    minZoom: 0.40,
                    maxZoom: 50,
                    zoomScaleSensitivity: 0.25,
                    dblClickZoomEnabled: true,
                    beforeZoom: hidePopovers,
                    beforePan: hidePopovers
                });

              window.zoomHeatmap[heatMapSelector].zoom(0.85);
            }
          }

          if (svg_class=='hiveplot') {
            // If heatmap being resized, reset zoom

              // Destroy old zoom on heatmap
            var container = "#" + $('.main_option:visible').attr('id');
            container = container+ ' .hiveplot-container';
            if (window.zoomHiveplot[container] != null) {
              window.zoomHiveplot[container].destroy();
              delete window.zoomHiveplot[container];

              window.zoomHiveplot[container] = svgPanZoom(container + ' .hiveplot', {
                  zoomEnabled: true,
                  // controlIconsEnabled: true,
                  fit: true,
                  center: true,
                  minZoom: 0.75,
                  maxZoom: 50,
                  zoomScaleSensitivity: 0.25,
                  dblClickZoomEnabled: true
              });

              window.zoomHiveplot[container].zoom(0.85);
            }
          }

        }

        function initializeSegmentButtons(selector) {
            // Initialize segment buttons.
            $(selector + ' .segments-panel button').each(function() {
                var s = $(this).attr('data-segment');

                // Return if no segment data
                if (s == null) {
                    return;
                }

                $(this).click(function() {
                    var segments = [];
                    $(this).toggleClass('active');
                    $(selector + ' .segments-panel button.active').each(function() {
                        segments = segments.concat($(this).data('segment').split(' '));
                    });
                    $(selector + ' .segments-input').val(JSON.stringify(segments));
                });
            });

            // Initialize 'all' buttons.
            $(selector  + ' .segments-panel .all-button').each(function() {
                $(this).click(function() {
                    if ($(this).html() === 'All') {
                        $(this).html('None');
                        $(this).parent().find('button').each(function() {
                            var s = $(this).attr('data-segment');

                            // Return if no segment data
                            if (s == null) {
                                return;
                            }

                            if (!$(this).hasClass('active')) {
                                $(this).trigger('click');
                            }
                        });
                    } else {
                        $(this).html('All');
                        $(this).parent().find('button').each(function() {
                            var s = $(this).attr('data-segment');

                            // Return if no segment data
                            if (s == null) {
                                return;
                            }

                            if ($(this).hasClass('active')) {
                                $(this).trigger('click');
                            }
                        });
                    }

                });

                // Update data
                var segments = [];
                $(selector + ' .segments-panel button.active').each(function() {
                    segments.push($(this).data('segment'));
                });
                $(selector + ' .segments-panel .segments-input').val(JSON.stringify(segments));

                // Trigger click on initialization
                $(this).trigger('click');
            });
        }

        function initializeInteractionButtons(selector) {
            // Initialize interaction buttons.
            $(selector + ' .interactions-panel button').each(function() {
                var s = $(this).attr('data-interaction-type');

                // Return if no segment data
                if (s == null) {
                    return;
                }

                $(this).click(function() {
                    var interactions = [];
                    $(this).toggleClass('active');
                    $(selector + ' .interactions-panel button.active').each(function() {
                        interactions = interactions.concat($(this).data('interaction-type').split(' '));
                    });
                    $(selector + ' .interactions-input').val(JSON.stringify(interactions));
                });
            });

            // Initialize 'all' buttons.
            $(selector  + ' .interactions-panel .all-button').each(function() {
                $(this).click(function() {
                    if ($(this).html() === 'All') {
                        $(this).html('None');
                        $(this).parent().find('button').each(function() {
                            var s = $(this).attr('data-interaction-type');

                            // Return if no segment data
                            if (s == null) {
                                return;
                            }

                            if (!$(this).hasClass('active')) {
                                $(this).trigger('click');
                            }
                        });
                    } else {
                        $(this).html('All');
                        $(this).parent().find('button').each(function() {
                            var s = $(this).attr('data-interaction-type');

                            // Return if no segment data
                            if (s == null) {
                                return;
                            }

                            if ($(this).hasClass('active')) {
                                $(this).trigger('click');
                            }
                        });
                    }
                });

                // Update data
                var interactions = [];
                $(selector + ' .interactions-panel button.active').each(function() {
                    interactions.push($(this).data('interaction-type'));
                });
                $(selector + ' .interactions-input').val(JSON.stringify(interactions));

                // Trigger click on initialization
                $(this).trigger('click');
            });
        }


        function initializeGoButton(selector, heatmapFunction, generic=false) {
            $(selector + ' .go-button').click(function() {
                var pdb = JSON.parse($(selector + ' .crystal-pdb').val());
                //pdb = ["4BVN"]
                //pdb = ["5JQH", "3SN6", "4AMJ"]
                loadPDBsView(pdb, selector, heatmapFunction, generic)
            });
        }

        function generate_display_options() {

          options = [ ['heatmap','Matrix of interactions'], ['flareplot','Flare Plot'], ['ngl','3D view'], ['schematic_non','Schematic (Non-consecutive)'], ['schematic_con','Schematic (Consecutive)'],];

          dropdown_html = '<div class="dropdown" style="display: inline;"> \
                          <button class="btn btn-xs btn-primary dropdown-toggle" type="button" data-toggle="dropdown"> \
                          Select plot \
                          <span class="caret"></span></button><ul class="dropdown-menu">';
          options.forEach(function(opt) {
            dropdown_html += '<li><a class="plot_selection" href="#" plot_type="'+opt[0]+'">'+opt[1]+'</a></li>'
          });
          dropdown_html += '</ul></div>';
          $('.plot-select').each( function (e) {
            $(this).html(dropdown_html);
          });
          $('.plot_selection').click(function() {
              var mode = $('.contact-browser:visible').attr('id').replace("-primary-browser","");
              plot_type = $(this).attr('plot_type');
              plot_div = $(this).closest('.panel');
              plot_id = plot_div.attr('id');
              // Delete whatever is already there
              plot_div.find('.plot-container').html('');
              console.log("SET UP PLOT",plot_type,plot_div,plot_id,mode);
              switch (plot_type) {
                case "ngl":
                    var pdb = JSON.parse($('.main_option:visible .crystal-pdb').val());
                    plot_div.find('.plot-container').removeClass('none');
                    plot_div.find('.plot-container').addClass('ngl-container');
                    plot_div.find('.plot-container').attr('id','ngl-'+plot_id);
                    plot_div.find('.plot-container').attr('style','margin: auto; width: 100%; height: 500px; overflow: hidden;');
                    createNGLview(plot_id,pdb[0]);
                    break;
                case "heatmap":
                    plot_div.find('.plot-container').removeClass('none');
                    plot_div.find('.plot-container').addClass('heatmap-container');
                    plot_div.find('.plot-container').attr('id',plot_id);
                    plot_div.find('.plot-container').html('<svg class="heatmap" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin" id="heatmap-'+plot_id+'" style="height: 500px;"></svg>');

                    renderHeatmap(raw_data, '#'+plot_id);
                    break;
                case "flareplot":
                    plot_div.find('.plot-container').removeClass('none');
                    plot_div.find('.plot-container').addClass('flareplot-container');
                    plot_div.find('.plot-container').attr('id','flareplot-'+plot_id);
                    createFlareplotBox(raw_data, '#flareplot-'+plot_id);
              }
          });
        }
        var raw_data = ''
        function loadPDBsView(pdb, selector, heatmapFunction, generic) {
          $(".main_loading_overlay").show();
          //var segments = JSON.parse($(selector + ' .segments-input').val());
          var segments = ['TM1','TM2','TM3','TM4','TM5','TM6','TM7','H8','ICL1','ECL1','ICL2','ECL2','ICL3','ECL3','N-term','C-term'];
          if (pdb.length > 0 && segments.length > 0) {
              var interactionTypes = JSON.parse($(selector + ' .interactions-input').val());
              $(".heatmap").hide();
              // $(".heatmap-legend").hide();
              $(".matrix-tab:visible").click();

              $(selector + ' .heatmap-container').append('<span id=svgloading>Loading...</span>');
              if (!$(selector + ' .interactions-input').val() == null)
                  interactionTypes = JSON.parse($(selector + ' .interactions-input').val());

              console.log('get viz info');
              $.ajax({ 
                  url: '/contactnetwork/interactiondata', 
                  dataType: 'json', 
                  data: {
                    // 'segments': segments,
                    'generic': generic,
                    'pdbs': pdb,
                    'interaction_types': interactionTypes
                  }, 
                  async: true, 
                  success:  function(data){
                    raw_data = data;
                    console.log('gotten visual info')
                    // Re-render heatmap
                    $(".heatmap").show();
                    // $(".heatmap-legend").show();
                    console.log('start heatmap');
                    heatmapFunction(data, selector + ' .heatmap-container');
                    console.log('finish heatmap');
                    $("#svgloading").remove()
                    // Re-render flareplot
                    createFlareplotBox(data, selector + " .flareplot-container");

                    if (selector == '#single-crystal-group-tab') {
                      createSchematicPlot(data, selector + " .schematic_con-container", {type: 'singleCrystalGroup'}); //.schematic_container
                      createSchematicPlot(data, selector + " .schematic_non-container", {isContiguousPlot: false, type: 'singleCrystalGroup'});
                      createNGLview("single-group",pdb[0], pdb);
                    } else {
                      createHiveplotBox(data, selector + " .hiveplot-container");
                      createSchematicPlot(data, selector + " .schematic_con-container"); //.schematic_container
                      createSchematicPlot(data, selector + " .schematic_non-container", {isContiguousPlot: false});
                      createNGLview("single",pdb[0]);
                    }
                    $(".main_loading_overlay").hide();
                    redraw_renders();
                  }
              });
              console.log('get browser info');
              $.ajax({ 
                  url: '/contactnetwork/browserdata', 
                  dataType: 'json', 
                  data: {
                    // 'segments': segments,
                    'generic': generic,
                    'pdbs': pdb,
                    'interaction_types': interactionTypes
                  }, 
                  async: true, 
                  success:  function(data){
                    // Re-render heatmap
                    data_browser = data;
                    renderBrowser(data);
                    generate_display_options();
                    console.log('gotten browser info')
                  }
              });

          }
        }


        function initializeGoButtonTwoCrystalGroups(selector, heatmapFunction, generic=false) {
            $(selector + ' .go-button').click(function() {
                var pdbs1 = JSON.parse($(selector + ' .crystal-group-1-pdbs').val());
                var pdbs2 = JSON.parse($(selector + ' .crystal-group-2-pdbs').val());
                loadTwoPDBsView(pdbs1, pdbs2, selector, heatmapFunction, generic)


            });
        }

        function loadTwoPDBsView(pdbs1, pdbs2, selector, heatmapFunction, generic) {
            $(".main_loading_overlay").show();
            //var segments = JSON.parse($(selector + ' .segments-input').val());
            var segments = ['TM1','TM2','TM3','TM4','TM5','TM6','TM7','H8','ICL1','ECL1','ICL2','ECL2','ICL3','ECL3','N-term','C-term'];
            if (pdbs1.length > 0 && pdbs2.length > 0 && segments.length > 0) {
                var interactionTypes = JSON.parse($(selector + ' .interactions-input').val());
                $(".heatmap").hide();
                // $(".heatmap-legend").hide();
                $(".matrix-tab:visible").click();
                $(selector + ' .heatmap-container').append('<span id=svgloading>Loading... (0%)</span>');



                console.log('get browser info');
                $.ajax({ 
                    url: '/contactnetwork/browserdata', 
                    dataType: 'json', 
                    data: {
                      // 'segments': segments,
                      'generic': generic,
                      'pdbs1': pdbs1,
                      'pdbs2': pdbs2,
                      'interaction_types': interactionTypes
                    }, 
                    async: true, 
                    success:  function(data){
                      // Re-render heatmap
                      data_browser = data;
                      renderBrowser(data);
                      console.log('gotten browser info')
                    }
                });

                console.log('get wiz info');
                $.getJSON( '/contactnetwork/interactiondata',
                {
                    'segments': segments,
                    'generic': generic,
                    'pdbs': pdbs1,
                    'interaction_types': interactionTypes
                },
                function( data1 ) {
                    $("#svgloading").remove();
                    $(selector + ' .heatmap-container').append('<span id="svgloading">Loading... (33%)</span>');
                    $.getJSON( '/contactnetwork/interactiondata',
                    {
                        'segments': segments,
                        'generic': generic,
                        'pdbs': pdbs2,
                        'interaction_types': interactionTypes
                    },
                    function( data2 ) {
                        $("#svgloading").remove();
                        $(selector + ' .heatmap-container').append('<span id="svgloading">Loading... (66%)</span>');
                        // NOTE: this call seems redundant, shouldn't we already have all the data we need from the previous two calls
                        $.getJSON( '/contactnetwork/interactiondata',
                        {
                            'segments': segments,
                            'generic': generic,
                            'pdbs': pdbs1.concat(pdbs2),
                            'interaction_types': interactionTypes
                        }, function ( data3 ) {
                            // Re-render heatmap
                            $(".heatmap").show();
                            // $(".heatmap-legend").show();
                            $("#svgloading").remove()
                            heatmapFunction([data1, data2, data3], selector + ' .heatmap-container');
                            createSchematicPlot(data3, selector + " .schematic_con-container", {type: 'twoCrystalGroups'}, data1, data2); //.schematic_container
                            createSchematicPlot(data3, selector + " .schematic_non-container", {isContiguousPlot: false, type: 'twoCrystalGroups'}, data1, data2)

                            // Re-render flareplot
                            createTwoGroupFlareplotBox(data1, data2, data3, selector + " .flareplot-container");
                            createNGLview("two-groups",pdbs1[0], pdbs1, pdbs2);
                            $(".main_loading_overlay").hide();
                            redraw_renders();
                        });
                    });
                });

            }
          // $(".main_loading_overlay").hide();
        }


        function initializeFullscreenButton(selector) {
            // var fullScreenElement = $(selector + ' .heatmap-container').get(0);
            $(selector + ' .btn-fullscreen').click(function() {
                  // console.log($(this).parent().parent().next().children().first());
//                console.log($(this).attr('id'));
                fullScreenElement = $(this).parent().parent().next().children().first();
                fullScreenElement.css('background-color','white');
                console.log('who to fullscreen?',fullScreenElement.attr('id'));
                toggleFullScreen(fullScreenElement.get(0));
                if (fullScreenElement.attr('id')) {
                  if (fullScreenElement.attr('id').startsWith('DataTable')) {
                    top_height = $('div.dataTables_scrollHead:visible').outerHeight();
                    bottom_height =  $('div.dataTables_info:visible').outerHeight();
                    scrollbody_height = screen.height-top_height-bottom_height;
                    $('div.dataTables_scrollBody:visible').height( scrollbody_height+'px' );
                  }
                }
            });
        }


        function createTwoGroupFlareplotBox(data1, data2, data3, container, toggle = false) {
          // prepare two group data for visualization
          var data = data3;

          // frequency + count holder
          data["frequency"] = {};
          data["count"] = {};

          Object.keys(data.interactions).forEach(function(pair) {
            var f1 = 0, f2 = 0, c1 = 0, c2 = 0;;
            if (pair in data1.interactions) {
                c1 = Object.keys(data1.interactions[pair]).length;
                f1 = c1/data1.pdbs.length;
            }
            if (pair in data2.interactions) {
                c2 = Object.keys(data2.interactions[pair]).length;
                f2 = c2/data2.pdbs.length;
            }
            var f3 = f1 - f2;
            var c3 = c1 + c2;
            data["frequency"][pair] = [f1, f2, f3];
            data["count"][pair] = [c1, c2, c3];
          });

          createFlareplotBox(data, container, toggle = false);
        }

        var flareplot = {};
        var contiguous = true;
        var interactionsToggleList = [];
        function createFlareplotBox(data, container, toggle = false) {
            // clean
            if (toggle){
                $(container).children().last().remove();
            } else {
                // in case refresh with new parameters => reset
                contiguous = true;
                $(container).html("");
            }

            // add menu
            if (!toggle){
                var newDiv = document.createElement("div");
                newDiv.setAttribute("class", "flareplot-legend");

                var content = '<div class="controls">'
//                                  +'<h4>Controls</h4>';

                // only possible with more than 4 segments, otherwise it will become a mess
                if (data.segments.length > 4)
                    content += '<p>Consecutive segment contacts<br> on outside: <input type=checkbox id="flareplot_contiguous" checked></p>';

                content += '<p>Line colors: <select id="flareplot_color">'
                        +'<option value="none">None (gray)</option>'
                        +'<option value="rainbow">GPCR rainbow</option>'
                        +'<option value="segment">GPCR segment</option>';

                // if single structure - use interaction coloring
                if (container.indexOf("single-crystal-tab") >= 0) {
                    content += '<option value="interactions" selected>Interaction Type</option>';
                // if single group of structures - use frequency coloring (gradient)
                } else if (container.indexOf("single-crystal-group-tab") >= 0) {
                    content += '<option value="frequency" selected>Interaction Frequency/Count</option>';
                // if group(s) of structures - use frequency coloring (gradient)
                } else {
                    content += '<option value="frequency" selected>Frequency difference Gr1 - Gr2</option>';
                    content += '<option value="frequency_1">Frequency group 1</option>';
                    content += '<option value="frequency_2">Frequency group 2</option>';
                } 
                content += '</select></p>';


                // Populate heatmap legend
                if (container.indexOf("single-crystal-tab") >= 0 ) {
                    /*
                    // TODO Optimize/generalize interaction set selection - code duplication
                    var interactionTypes = new Set(["Ionic", "Polar", "Aromatic", "Hydrophobic", "Van-der-Waals"]);

                    // Add interactions color legend
                    //content += '<h4>Toggle interactions</h4><ul>';
                    content += '<ul>';

                    interactionTypes = Array.from(interactionTypes).sort(function (i1, i2) {
                        return getInteractionStrength(i2) - getInteractionStrength(i1);
                    });

                    interactionTypes.forEach(function(i) {
                        var rgb = getInteractionColor(i, false);
                        content += '<li>'
                                + '<div class="color-box" style="background-color: ' + rgb + '">' + '<input type="checkbox" data-interaction-type="' + i.toLowerCase() +'"></input>' + '</div><p>' + i + '</p>'
                                + '</li>';
                    });
                    content += '</ul></div>';*/
                } else if (container.indexOf("single-crystal-group-tab") >= 0) {
                    // slider 1 to count
                    /*content += '<h4 class="center">Frequency (#PDBs)</h4>'
                        + '<p>Range: <span id="pdbs-range-flare">1 - ' + data.pdbs.length + '</span></p>'
                        + '<div class="slider-range" data-text-id="pdbs-range-flare" id="pdbs-range-flare-slider"></div>'
                        + '<div class="temperature-scale">'
                        + '<span class="gray-to-red"></span>'
                        + '</div>';

                    $( function() {
                      $( container+" .slider-range" ).data({ "referenceContainer" : container })
                      $( container+" .slider-range" ).slider({
                        range: true,
                        min: 1,
                        max: data.pdbs.length,
                        step: 1,
                        values: [0,data.pdbs.length],
                        slide: function( event, ui ) {
                          $( "#"+$(this).attr("data-text-id") ).html( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
                          flareplot[$(this).data("referenceContainer")].updateRange(ui.values[ 0 ], ui.values[ 1 ]);
                        }
                      });
                    } );*/
                } else {
                    /*content += '<h4 class="center">Frequency</h4>'
                        + '<p>Group 1 range: <span id="freq-flare-range-1">0 - 1</span></p>'
                        + '<div class="slider-range" data-text-id="freq-flare-range-1" id="freq-flare-slider-range-1"></div>'
                        + '<p>Group 2 range: <span id="freq-flare-range-2">0 - 1</span></p>'
                        + '<div class="slider-range" data-text-id="freq-flare-range-2" id="freq-flare-slider-range-2"></div>'
                        + '<p>Freq difference range: <span id="freq-flare-range-3">-1 - 1</span></p>'
                        + '<div class="slider-range-diff" data-text-id="freq-flare-range-3" id="freq-flare-slider-range-3"></div>'
                        + '<div class="temperature-scale">'
                        + '<span class="red-to-gray"></span>'
                        + '<span class="gray-to-blue"></span>'
                        + '</div>'
                        + '</div>';

                        $( function() {
                          $( container+" #freq-flare-slider-range-1" ).data({ "referenceContainer" : container });
                          $( container+" #freq-flare-slider-range-2" ).data({ "referenceContainer" : container });
                          $( container+" #freq-flare-slider-range-3" ).data({ "referenceContainer" : container });
                          $( container+" #freq-flare-slider-range-1" ).slider({
                            range: true,
                            min: 0,
                            max: 1,
                            step: 0.01,
                            values: [0,1],
                            slide: function( event, ui ) {
                              $( "#"+$(this).attr("data-text-id") ).html( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
                              updateTwoGroupSliders($(this)[0].id, ui);
                            }
                          });
                          $( container+" #freq-flare-slider-range-2" ).slider({
                            range: true,
                            min: 0,
                            max: 1,
                            step: 0.01,
                            values: [0,1],
                            slide: function( event, ui ) {
                              $( "#"+$(this).attr("data-text-id") ).html( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
                              updateTwoGroupSliders($(this)[0].id, ui);
                            }
                          });
                          $( container+" #freq-flare-slider-range-3" ).slider({
                            range: true,
                            min: -1,
                            max: 1,
                            step: 0.01,
                            values: [-1,1],
                            slide: function( event, ui ) {
                              $( "#"+$(this).attr("data-text-id") ).html( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
                              updateTwoGroupSliders($(this)[0].id, ui);
                            }
                          });
                        });*/
                }

                newDiv.innerHTML = content;

                $(container).append(newDiv);

                $(container+" #flareplot_contiguous").click(function(e){
                    $(function() {
                      contiguous = !contiguous;
                      createFlareplotBox(data, container, true);
                      redraw_renders();
                    });
                });


                $(container+" #flareplot_color").data({ "referenceContainer" : container })
                $(container+" #flareplot_color").change(function(e){
                    flareplot[$(this).data("referenceContainer")].updateColors($(this).val(), interactionsToggleList);
                });

                $(container + ' .flareplot-legend .color-box input[type=checkbox]').each(function() {
                    $(this).prop('checked', true);

                    // init toggle list
                    interactionsToggleList.push($(this).data('interaction-type'));
                    $(this).data({ "referenceContainer" : container })

                    $(this).change(function() {
                        // toggle interactions in flareplot
                        interactionsToggleList = [];

                        $(container + ' .flareplot-legend input[type=checkbox]').each(function() {
                          if ($(this).prop('checked'))
                              interactionsToggleList.push($(this).data('interaction-type'));
                        });

                        // toggle interactions in flareplot
                        flareplot[$(this).data("referenceContainer")].showInteractions(interactionsToggleList);
                    });
                });
            }

            // create flareplot
            flareplot[container] = createFlareplot(1000, parseGPCRdb2flare(data), container, contiguous);

            // update coloring and visibility if toggled
            if (toggle) {
                // var range = $( container+" .slider-range" ).slider("values");
                // flareplot[container].updateRange(range[0], range[1]);

                flareplot[container].updateColors($(container+" #flareplot_color").val(), interactionsToggleList);
                //if ($(container + ' .flareplot-legend .color-box input[type=checkbox]').length > 0)
                //  flareplot[container].showInteractions(interactionsToggleList);
                // if (container.indexOf("two-crystal-groups-tab") >= 0)
                //   updateTwoGroupSliders("skip", []);

                updateGeneralControls()
            } else {
              flareplot[container].updateColors($(container+" #flareplot_color").val(), interactionsToggleList);
            }
        }

        function createHiveplotBox(data, container) {
            // clean contents
            $(container).html("");

            createHiveplot(data, container);

            // display in the back to enable SVGPan
            $("#single-hiveplot-tab").show();

            // Make zoomable
            window.zoomHiveplot[container] = svgPanZoom(container + ' .hiveplot', {
                zoomEnabled: true,
                // controlIconsEnabled: true,
                fit: true,
                center: true,
                minZoom: 0.75,
                maxZoom: 50,
                zoomScaleSensitivity: 0.25,
                dblClickZoomEnabled: true
            });

            // remove display value on element
            $("#single-hiveplot-tab").css("display","")
        }


        var stage = {};
        var pdb_data = {};
        var color_schemes = {};
        var reps = {} // store ngl representations
        var gpcr_rep = {}
        var int_labels = []
        function createNGLview(mode, pdb, pdbs = false, pdbs_set2 = false, pdb2 = false) {
            $("#ngl-"+mode).html("");
            stage[mode] = new NGL.Stage( "ngl-"+mode, { backgroundColor: "white" } );
            color_schemes[mode] = [[],[]];
            reps[mode] = [{},{}]
            gpcr_rep[mode] = [];
            pdb_data[mode] = [];
            int_labels[mode] = []

            var first_structure;
            var num_set1;
            var gn_num_set1;
            var two_structures = false;

            //var blue_colors = ['#f7fcf0','#e0f3db','#ccebc5', '#a8ddb5',    '#7bccc4',    '#4eb3d3', '#2b8cbe',    '#0868ac',    '#084081']
            var blue_colors = ['#f0fcfa','#D3E4EA','#B6CDDB', '#99B5CC',    '#7C9EBD',    '#5F86AE', '#426F9F',    '#255790',    '#084081']
            var red_colors = ['#fbf0fc','#f3dbec','#ebc5df', '#dda8bc',    '#cc7b7f',    '#d3574e', '#be372b',    '#ac1808',    '#811808']
            var rb_colors = ['#736DA7','#5EB7B7','#CE9AC6', '#DD7D7E', '#E6AF7C', '#DEDB75', '#80B96F', '#000000']  // #C897B8

            $.getJSON( "pdb/"+pdb,
              function( data ) {
                var highlight = ['TM1', 'TM2', 'TM3', 'TM4', 'TM5', 'TM6', 'TM7', 'H8'];
                var segments_sets = {}
                int_labels[mode][0] = {}

                highlight.forEach( function(e){
                  segments_sets[e] = ((e in data['segments']) ? data['segments'][e].join(", ") : "")
                });

                pdb_data[mode][0] = data;
                color_schemes[mode][0]['blue'] = NGL.ColormakerRegistry.addSelectionScheme([
                        [blue_colors[1], segments_sets[highlight[0]]],
                        [blue_colors[2], segments_sets[highlight[1]]],
                        [blue_colors[3], segments_sets[highlight[2]]],
                        [blue_colors[4], segments_sets[highlight[3]]],
                        [blue_colors[5], segments_sets[highlight[4]]],
                        [blue_colors[6], segments_sets[highlight[5]]],
                        [blue_colors[7], segments_sets[highlight[6]]],
                        [blue_colors[8], segments_sets[highlight[7]]],
                        [ "white", "*" ]
                        ])

                color_schemes[mode][0]['grey'] = NGL.ColormakerRegistry.addSelectionScheme([
                          ["#ccc", segments_sets[highlight[0]]],
                          ["#bbb", segments_sets[highlight[1]]],
                          ["#aaa", segments_sets[highlight[2]]],
                          ["#888", segments_sets[highlight[3]]],
                          ["#666", segments_sets[highlight[4]]],
                          ["#444", segments_sets[highlight[5]]],
                          ["#333", segments_sets[highlight[6]]],
                          ["#111", segments_sets[highlight[7]]],
                          [ "white", "*" ]
                          ])

                color_schemes[mode][0]['rainbow'] = NGL.ColormakerRegistry.addSelectionScheme([
                        [rb_colors[0], segments_sets[highlight[0]]],
                        [rb_colors[1], segments_sets[highlight[1]]],
                        [rb_colors[2], segments_sets[highlight[2]]],
                        [rb_colors[3], segments_sets[highlight[3]]],
                        [rb_colors[4], segments_sets[highlight[4]]],
                        [rb_colors[5], segments_sets[highlight[5]]],
                        [rb_colors[6], segments_sets[highlight[6]]],
                        [rb_colors[7], segments_sets[highlight[7]]],
                        [ "white", "*" ]
                        ])

                chain_set1 = pdb_data[mode][0]['chain'];
                num_set1 = pdb_data[mode][0]['only_gn'];
                gn_num_set1 = pdb_data[mode][0]['gn_map'];

                var stringBlob = new Blob( [ pdb_data[mode][0]['pdb'] ], { type: 'text/plain'} );
                stage[mode].loadFile( stringBlob, { ext: "pdb" }  ).then( function( o ){
                    first_structure = o

                    // Cleanup
                    pdb_data[mode][0]['pdb'] = null;

                    // TODO: cartoon for ECL2 is currently not shown (only 3 res, but 4 needed for cartoon) - show ribbon for ICL/ECLs?
                    gpcr_rep[mode][0] = o.addRepresentation( "cartoon", {
                      sele: ":"+pdb_data[mode][0]['chain']+" and ("+pdb_data[mode][0]['only_gn'].join(", ")+")",
                      // radiusType: '',
                      radiusSize: 1,
                      radiusScale: 0.6,
                      // color: "atomindex",
                      // colorScale: "Accent",
                      // color: "residueindex",
                      // colorScale: "greys",
                      color: color_schemes[mode][0]['blue'],
                      metalness: 0,
                      colorMode: "hcl",
                      roughness: 1,
                      opacity: 0.4,
                      side: "front",
                      depthWrite: true
                    });

                    // REMOVE default hoverPick mouse action
                    stage[mode].mouseControls.remove("hoverPick")

                    // Add residue labels for GN residues
                    pdb_data[mode][0]['only_gn'].forEach( function(resNo, index){
                      var genNo = pdb_data[mode][0]['gn_map'][index]
                      int_labels[mode][0][o.structure.id + "|" + resNo] = genNo
                    })

                    // listen to `hovered` signal to move tooltip around and change its text
                    stage[mode].signals.hovered.add(function (pickingProxy) {
                      var label_index = false
                      var hide = true

                      if (pickingProxy && (pickingProxy.distance || pickingProxy.atom)) {
                        var mp = pickingProxy.mouse.position

                        if (pickingProxy.distance){
                          label_index = pickingProxy.distance.atom1.structure.id + "|" + pickingProxy.distance.atom1.resno + "-" + pickingProxy.distance.atom2.resno;
                          ngl_tooltip.innerText = "INTERACTION:"
                        } else {
                          label_index = pickingProxy.atom.structure.id + "|" + pickingProxy.atom.resno;
                          ngl_tooltip.innerText = "RESIDUE:"
                        }

                        if (label_index){
                          if (label_index in int_labels[mode][0]) {
                            ngl_tooltip.innerText += " " +int_labels[mode][0][label_index]
                            hide = false
                          } else if (mode=="two-groups" && (label_index in int_labels[mode][1])) {
                            ngl_tooltip.innerText += " " +int_labels[mode][1][label_index]
                            hide = false
                          }
                          ngl_tooltip.style.bottom = window.innerHeight - mp.y + 3 + "px"
                          ngl_tooltip.style.left = mp.x + 3 + "px"
                          ngl_tooltip.style.display = "block"
                        }
                      }
                      if (hide) {
                        ngl_tooltip.style.display = "none"
                      }
                    })

                    reps[mode][0].structureComponent = o
                    createNGLRepresentations(mode, 0, false)

                    // Automatic GPCR positioning
                    if ("translation" in pdb_data[mode][0]){
                      var translation = JSON.parse(pdb_data[mode][0]["translation"])
                      var center_axis = JSON.parse(pdb_data[mode][0]["center_axis"])

                      // calculate rotation and apply
                      v1 = new NGL.Vector3(0,1,0)
                      v2 = new NGL.Vector3(center_axis[0], center_axis[1], center_axis[2])
                      var quaternion = new NGL.Quaternion(); // create one and reuse it
                      quaternion.setFromUnitVectors( v2, v1 )
                      o.setRotation(quaternion)

                      // calculate translation and apply
                      var v = new NGL.Vector3( -1*translation[0], -1*translation[1], -1*translation[2])
                      v.applyMatrix4(o.matrix)
                      o.setPosition([-1*v.x, -1*v.y, -1*v.z])

                      // calculate H8 position (based on TM1)
                      var tm1_vector
                      var ref_tm1 = pdb_data[mode][0]["only_gn"][pdb_data[mode][0]["gn_map"].indexOf("1x46")]
                      o.structure.eachAtom(function (ap) {
                        tm1_vector = new NGL.Vector3(ap.x, ap.y, ap.z)
                        tm1_vector.applyMatrix4(o.matrix)
                      }, new NGL.Selection(":"+pdb_data[mode][0]['chain']+" and "+ ref_tm1 +" and .CA"))

                      tm1_vector.y = 0 // height position doesn't matter
                      tm1_vector.normalize()

                      // calculate rotation angle around Y-axis (as the GPCR is now upright)
                      v3 = new NGL.Vector3(-1, 0, 0)
                      var m = new NGL.Matrix4()
                      if (tm1_vector.z < 0)
                        m.makeRotationY(v3.angleTo(tm1_vector))
                      else if (tm1_vector.z > 0)
                        m.makeRotationY(-1*v3.angleTo(tm1_vector))

                      o.setTransform(m)
                    }

                    o.autoView(":"+pdb_data[mode][0]['chain']+" and ("+pdb_data[mode][0]['only_gn'].join(", ")+") and (.CA)")
                } );

            }).then( function(){
                if (pdbs_set2){
                    $.getJSON( "pdb/"+pdb2,
                      function( data ) {
                        var highlight = ['TM1', 'TM2', 'TM3', 'TM4', 'TM5', 'TM6', 'TM7', 'H8'];
                        var segments_sets = {}
                        int_labels[mode][1] = {}

                        highlight.forEach( function(e){
                          segments_sets[e] = ((e in data['segments']) ? data['segments'][e].join(", ") : "")
                        });

                        pdb_data[mode][1] = data;
                        num_set2 = pdb_data[mode][1]['only_gn'];
                        gn_num_set2 = pdb_data[mode][1]['gn_map'];

                        // intersect GN-numbering
                        var matching_TM_residues = [];
                        gn_num_set1.forEach(function(gn, gn_index) {
                          // Filter GN residues, only within 7TM + present in other protein
                          if (gn.charAt(1)=='x' && gn.charAt(0)<=7){
                            var match = gn_num_set2.indexOf(gn);
                            if (match > -1){
                              return matching_TM_residues.push([num_set1[gn_index], num_set2[match]]);
                            }
                          }
                        });

                        color_schemes[mode][1]['red'] = NGL.ColormakerRegistry.addSelectionScheme([
                                [red_colors[1], segments_sets[highlight[0]]],
                                [red_colors[2], segments_sets[highlight[1]]],
                                [red_colors[3], segments_sets[highlight[2]]],
                                [red_colors[4], segments_sets[highlight[3]]],
                                [red_colors[5], segments_sets[highlight[4]]],
                                [red_colors[6], segments_sets[highlight[5]]],
                                [red_colors[7], segments_sets[highlight[6]]],
                                [red_colors[8], segments_sets[highlight[7]]],
                                [ "white", "*" ]
                                ])

                        color_schemes[mode][1]['rainbow'] = NGL.ColormakerRegistry.addSelectionScheme([
                                [rb_colors[0], segments_sets[highlight[0]]],
                                [rb_colors[1], segments_sets[highlight[1]]],
                                [rb_colors[2], segments_sets[highlight[2]]],
                                [rb_colors[3], segments_sets[highlight[3]]],
                                [rb_colors[4], segments_sets[highlight[4]]],
                                [rb_colors[5], segments_sets[highlight[5]]],
                                [rb_colors[6], segments_sets[highlight[6]]],
                                [rb_colors[7], segments_sets[highlight[7]]],
                                [ "white", "*" ]
                                ])

                        color_schemes[mode][1]['grey'] = color_schemes[mode][0]['grey']

                        var stringBlob = new Blob( [ pdb_data[mode][1]['pdb'] ], { type: 'text/plain'} );
                        stage[mode].loadFile( stringBlob, { ext: "pdb" }  ).then( function( o ){
                            // Cleanup
                            pdb_data[mode][1]['pdb'] = null;

                            //// SUPERPOSE structures using 7TM bundle ////

                            // Intersect GN-numbering of proteins and create Selection
                            var selectionOne = "(";
                            var selectionTwo = "(";
                            gn_num_set1.forEach(function(gn, gn_index) {
                              // Filter GN residues, only within 7TM + present in other protein
                              if (gn.charAt(1)=='x' && gn.charAt(0)<=7) {
                                var match = gn_num_set2.indexOf(gn);
                                if (match > -1) {
                                  if (selectionOne.length > 1){
                                    selectionOne += " or ";
                                    selectionTwo += " or ";
                                  }
                                  selectionOne += num_set1[gn_index];
                                  selectionTwo += num_set2[match];
                                }
                              }
                            });

                            selectionOne += ") and .CA and :" + pdb_data[mode][0]['chain'];
                            selectionTwo += ") and .CA and :" + pdb_data[mode][1]['chain'];

                            var atoms1 = first_structure.structure.getView(new NGL.Selection(selectionOne))
                            var atoms2 = o.structure.getView(new NGL.Selection(selectionTwo))

                            // Due to superposing apply transformation to second struture
                            var superpose = new NGL.Superposition(atoms2, atoms1)
                            superpose.transform(o.structure)
                            o.structure.refreshPosition()
                            o.updateRepresentations({ 'position': true })
                            o.setTransform(first_structure.matrix)

                            //// END SUPERPOSE ////
                            gpcr_rep[mode][1] = o.addRepresentation( "cartoon", {
                              sele: ":"+pdb_data[mode][1]['chain']+" and ("+pdb_data[mode][1]['only_gn'].join(", ")+")",
                              radiusSize: 1,
                              radiusScale: 0.6,
                              color: color_schemes[mode][1]['red'],
                              metalness: 0,
                              colorMode: "hcl",
                              roughness: 1,
                              opacity: 0.4,
                              side: "front",
                              depthWrite: true
                            });

                            // Add residue labels for GN residues
                            pdb_data[mode][1]['only_gn'].forEach( function(resNo, index){
                              var genNo = pdb_data[mode][1]['gn_map'][index]
                              int_labels[mode][1][o.structure.id + "|" + resNo] = genNo
                            })

                            reps[mode][1].structureComponent = o
                            createNGLRepresentations(mode, 1, false)
                            /*
                            // interactions for two groups tab
                            var res_int = []
                            $('#two-crystal-groups-tab .heatmap-container rect[data-frequency-diff]').each(function(e) {
                                var rect = $(this);
                                var genNo1 = rect.data('gen-no-1');
                                var genNo2 = rect.data('gen-no-2');
                                if ((genNo1=='-') || (genNo2=='-')) return

                                // Adjust GN numbering to the shown structure
                                var resNo1 = pdb_data[mode][1]['only_gn'][pdb_data[mode][1]['gn_map'].indexOf(genNo1)];
                                var resNo2 = pdb_data[mode][1]['only_gn'][pdb_data[mode][1]['gn_map'].indexOf(genNo2)];

                                if ((typeof resNo1=='undefined') || (typeof resNo2=='undefined')) return

                                // Push interactions
                                res_int.push(resNo1);
                                res_int.push(resNo2);
                              });

                            // NULL representation - for clarity purposes only showing links for first structure
                            reps[mode][1].links = o.addRepresentation( "spacefill", {
                              sele: ":F and :O and :O and :B and :A and :R",
                              visible: false
                            });
                            reps[mode][1].links_gn = reps[mode][1].links

                            reps[mode][1].int_res = o.addRepresentation( "spacefill", {
                              sele: ":"+pdb_data[mode][1]['chain']+" and ("+res_int.join(", ")+") and (.CA)",
                              color: "#811808",
                              // colorScale: ["#44f", "#444"],
                              radiusScale: .2,
                              name: "res",
                              visible: false
                            });


                            res_int_gn = Object.assign([], res_int);
                            res_int_gn = intersect(res_int_gn, pdb_data[mode][1]['only_gn']);
                            reps[mode][1].int_res_gn = o.addRepresentation( "spacefill", {
                              sele: ":"+pdb_data[mode][1]['chain']+" and ("+res_int_gn.join(", ")+") and (.CA)",
                              color: "#811808",
                              // colorScale: ["#44f", "#444"],
                              radiusScale: .2,
                              name: "res",
                              visible: true
                            });

                            reps[mode][1].ball_all = o.addRepresentation("ball+stick", {
                              sele: ":"+pdb_data[mode][1]['chain']+" and sidechainAttached",
                              color: "element",
                              colorValue: "#dda8bc",
                              visible: false
                              })

                            reps[mode][1].ball = o.addRepresentation("ball+stick", {
                              sele: ":"+pdb_data[mode][1]['chain']+" and ("+pdb_data[mode][1]['only_gn'].join(", ")+") and sidechainAttached",
                              color: "element",
                              colorValue: "#dda8bc",
                              visible: false
                              })

                            // CHECK: can res_int and res_int_gn actually be different?
                            reps[mode][1].ball_int = o.addRepresentation("ball+stick", {
                              sele: ":"+pdb_data[mode][1]['chain']+" and ("+res_int.join(", ")+") and sidechainAttached",
                              color: "element",
                              colorValue: "#dda8bc",
                              visible: false
                              })

                            reps[mode][1].ball_int_gn = o.addRepresentation("ball+stick", {
                              sele: ":"+pdb_data[mode][1]['chain']+" and ("+res_int_gn.join(", ")+") and sidechainAttached",
                              color: "element",</span>
                              colorValue: "#dda8b</span>c",
                              visible: false
                            })*/

                            o.autoView(selectionTwo);
                        } );

                    });
                }
            });

            var newDiv = document.createElement("div");
            newDiv.setAttribute("style", "position: absolute; top: 45px; left: 20px; background-color: #DDD; opacity: .8; padding: 10px;")
            var controls = '<div class="controls"><span class="pull-right ngl_controls_toggle"><span class="glyphicon glyphicon-option-horizontal btn-download png"></span></span>'
                         + '<span class="ngl_control"><h4>Controls</h4>';

            // Toggle for showing two structures simultaneously
            if (mode == "two-groups" && pdbs_set2)
              two_structures = true;
            else
              two_structures = false;

            if (pdbs){
                if (two_structures)
                  controls += '<p>Structure set 1: <select id="ngl_pdb_'+mode+'_ref">';
                else
                  controls += '<p>Structure: <select id="ngl_pdb_'+mode+'_ref">';
                for (var i = 0; i < pdbs.length; i++){
                    if (pdbs[i]==pdb)
                        controls += '<option value="'+pdbs[i]+'" SELECTED>'+pdbs[i]+'</option>';
                    else
                        controls += '<option value="'+pdbs[i]+'">'+pdbs[i]+'</option>';
                }
                controls += '</select></p>';
                if (two_structures)
                  controls += '<p>Hide: <input type=checkbox id="hide_pdb1"></p>';
            }
            controls += '<p>Colors: <select id="ngl_color"><option value="blue">blue</option><option value="rainbow">rainbow</option><option value="grey">greys</option></select></p><br/>';


            if (two_structures){
              if (!pdb2)
                pdb2 = pdbs_set2[0]

              controls += '<p>Structure set 2: <select id="ngl_pdb_'+mode+'_ref2">';
              for (var i = 0; i < pdbs_set2.length; i++){
                  if (pdbs_set2[i]==pdb2)
                      controls += '<option value="'+pdbs_set2[i]+'" SELECTED>'+pdbs_set2[i]+'</option>';
                  else
                      controls += '<option value="'+pdbs_set2[i]+'">'+pdbs_set2[i]+'</option>';
              }
              controls += '</select></p>';
                if (two_structures)
                  controls += '<p>Hide: <input type=checkbox id="hide_pdb2"></p>';
              controls += '<p>Colors: <select id="ngl_color2"><option value="red">red</option><option value="rainbow">rainbow</option><option value="grey">greys</option></select></p><br/>';
            }

            controls += '<p>Only GNs: <input type=checkbox id="ngl_only_gns" checked></p>'
                              +'<p>Highlight interacting res: <input type=checkbox id="highlight_res" checked></p>'
                              +'<p>Hide interaction lines: <input type=checkbox id="toggle_interactions"></p>'
//                              +'<p>Show all side-chains: <input type=checkbox id="toggle_sidechains"></p>'
                              +'<p>Show interacting side-chains: <input type=checkbox id="toggle_sidechains_int"></p>'
//                              +'<p>Show NGL derived contacts: <input type=checkbox id="ngl_contacts"></p>'
                              +'</div>';
            controls += '</span>';
            newDiv.innerHTML = controls;

            $("#ngl-"+mode).append(newDiv);
            $("#ngl-"+mode+" .ngl_control").hide();
            $('.ngl_controls_toggle').css( 'cursor', 'pointer' );
            $("#ngl-"+mode+" .ngl_controls_toggle").click(function() {
              $("#ngl-"+mode+" .ngl_control").toggle();
            });

            if (two_structures) {
              // structure selection
              $("#ngl_pdb_"+mode+"_ref").change(function(e){
                    createNGLview(mode, $(this).val(), pdbs, pdbs_set2, $("#ngl_pdb_"+mode+"_ref2").val());
              });
              $("#ngl_pdb_"+mode+"_ref2").change(function(e){
                    createNGLview(mode, $("#ngl_pdb_"+mode+"_ref").val(), pdbs, pdbs_set2, $(this).val(),);
              });

              // coloring structure 2
              $("#ngl-"+mode+" #ngl_color2").change(function(e){
                  gpcr_rep[mode][1].setParameters({
                    color: color_schemes[mode][1][$(this).val()]
                  });
              });
            } else {
              // structure selection
              $("#ngl_pdb_"+mode+"_ref").change(function(e){
                    createNGLview(mode, $(this).val(), pdbs, pdbs_set2);
              });
            }

            $("#ngl-"+mode+" #ngl_color").change(function(e){
                gpcr_rep[mode][0].setParameters({
                  color: color_schemes[mode][0][$(this).val()]
                });
            });


            $("#"+mode+"-NGL-tab-link").click(function(e){
                $(function() {
                  stage[mode].handleResize();
                });
            });

            $("#ngl-"+mode+" #ngl_only_gns").change(function(e){
                updateStructureRepresentations(mode);
            });

            $("#ngl-"+mode+" #highlight_res").change(function(e){
                updateStructureRepresentations(mode);
            });

            $("#ngl-"+mode+" #toggle_interactions").change(function(e){
                updateStructureRepresentations(mode);
            });


            $("#ngl-"+mode+" #hide_pdb1").change(function(e){
                updateStructureRepresentations(mode);
            });


            $("#ngl-"+mode+" #hide_pdb2").change(function(e){
                updateStructureRepresentations(mode);
            });

            /*$("#ngl-"+mode+" #toggle_sidechains").change(function(e){
                updateStructureRepresentations(mode);
            });*/

            $("#ngl-"+mode+" #toggle_sidechains_int").change(function(e){
                updateStructureRepresentations(mode);
            });

            /*$("#ngl-"+mode+" #ngl_contacts").change(function(e){
                updateStructureRepresentations(mode);
            });*/
        }

        var linkMap = {}
        var linkColourScheme = {}
        function createNGLRepresentations(mode, structureNumber, update = false) {
          if (mode=='single-crystal-tab') {mode='single'}
          if (mode=='single-crystal-group-tab') {mode='single-group'}
          if (mode=='two-crystal-groups-tab') {mode='two-groups'}
            console.log("createNGLRepresentations",mode,structureNumber);
            var links = []
            var res_int = []
            if (mode in reps && structureNumber in reps[mode] && reps[mode][structureNumber].structureComponent)
              var o = reps[mode][structureNumber].structureComponent;
            else
              return  // NGL not initialized

            // initialize linkMap + colorScheme
            if (!(mode in linkMap)) linkMap[mode] = {}
            if (!(structureNumber in linkMap[mode])) linkMap[mode][structureNumber] = {}
            if (!(mode in linkColourScheme)) linkColourScheme[mode] = {}

            // remove existing representations
            var enabledInteractions = []
            if (update){
              // create new links overview
              reps[mode][structureNumber].structureComponent.removeRepresentation(reps[mode][structureNumber].links)
            }

            var gnOnly = !update || $("#ngl-"+mode+" #ngl_only_gns").prop('checked');

            if (mode=='single') {
              var addedLinks = []

              // populate enabled interactions
              $('#' + currentTab + " .controls-panel input:checked").each( function (toggle) {
                enabledInteractions.push($(this).data('interaction-type'))
              });

              // Go through interaction table in inverse order (only show strongest color)
              $($('#single-crystal-tab .heatmap-interaction').get().reverse()).each(function(e) {
                  var rect = $(this);
                  var resNo1 = rect.data('res-no-1');
                  var resNo2 = rect.data('res-no-2');
                  var seg1 = rect.data('seg-1');
                  var seg2 = rect.data('seg-2');
                  var genNo1 = rect.data('gen-no-1');
                  var genNo2 = rect.data('gen-no-2');
                  var aa1 = rect.data('aa-1');
                  var aa2 = rect.data('aa-2');
                  var iType = rect.data('interaction-type');


                  var pair = resNo1 + "," + resNo2;
                  if ( !(filtered_gn_pairs.includes(pair)) && filtered_gn_pairs.length) {
                      return
                  } 

                  // Interaction type filtering
                  // if (update && !enabledInteractions.includes(iType)) return

                  // GN interacting residue filtering
                  if (gnOnly && ((genNo1=='-') || (genNo2=='-'))) return

                  // Only show one line - max strength
                  if (!addedLinks.includes(resNo1+"-"+resNo2)) {
                    addedLinks.push(resNo1+"-"+resNo2)

                    // add residues to the list when not already there
                    if (!res_int.includes(resNo1)) res_int.push(resNo1)
                    if (!res_int.includes(resNo2)) res_int.push(resNo2)

                    // create link for "distance" representation
                    links.push({"atoms": [resNo1+":"+pdb_data[mode][structureNumber]['chain']+".CA",resNo2+":"+pdb_data[mode][structureNumber]['chain']+".CA"], "data":{"color":getInteractionColor(iType)}, "resID":resNo1+"-"+resNo2})
                    int_labels[mode][structureNumber][o.structure.id + "|" + resNo1+"-"+resNo2] = genNo1+" - "+genNo2
                  }
                });
            } else if (mode=='single-group') {
              // get cutoffs from control-tab
              var [tMin,tMax] = [0, 9999999];
              if ($('#' + currentTab + ' #pdbs-range-slider').slider("instance"))
                [tMin,tMax] = $('#' + currentTab + ' #pdbs-range-slider').slider( "option", "values" );

              $('#single-crystal-group-tab .heatmap-container .heatmap-interaction').each(function(e) {
                  var rect = $(this);
                  var genNo1 = rect.data('gen-no-1');
                  var genNo2 = rect.data('gen-no-2');
                  var seg1 = rect.data('seg-1');
                  var seg2 = rect.data('seg-2');
                  var nInteractions = rect.data('num-interactions');
                  var nTotalInteractions = rect.data('total-possible-interactions');
                  var frequency = rect.data('frequency');

                  // apply cutoffs
                  if (nInteractions < tMin || tMax < nInteractions) return

                  // TODO Add frequency filtering here
                  if ((genNo1=='-') || (genNo2=='-')) return

                  var pair = genNo1 + "," + genNo2;
                  if ( !(filtered_gn_pairs.includes(pair)) && filtered_gn_pairs.length) {
                      return
                  } 

                  // Adjust GN numbering to the shown structure
                  var resNo1 = pdb_data[mode][structureNumber]['only_gn'][pdb_data[mode][structureNumber]['gn_map'].indexOf(genNo1)];
                  var resNo2 = pdb_data[mode][structureNumber]['only_gn'][pdb_data[mode][structureNumber]['gn_map'].indexOf(genNo2)];

                  if ((typeof resNo1=='undefined') || (typeof resNo2=='undefined')) return

                  // Push interactions
                  if (!res_int.includes(resNo1)) res_int.push(resNo1)
                  if (!res_int.includes(resNo2)) res_int.push(resNo2)

                  links.push({"atoms": [resNo1+":"+pdb_data[mode][structureNumber]['chain']+".CA",resNo2+":"+pdb_data[mode][structureNumber]['chain']+".CA"], "data":{"color":getFrequencyColor(frequency)}, "resID":resNo1+"-"+resNo2})
                  int_labels[mode][structureNumber][o.structure.id + "|" + resNo1+"-"+resNo2] = genNo1+" - "+genNo2
                });
            } else {
              // get cutoffs from control-tab if sliders are initialized
              var r1, r2, r3;
              r1 = r2 = r3 = [-1000, 1000]
              if ($('#' + currentTab + ' #freq-slider-range-1').slider("instance")){
                  r1 = $('#' + currentTab + ' #freq-slider-range-1').slider( "option", "values" );
                  r2 = $('#' + currentTab + ' #freq-slider-range-2').slider( "option", "values" );
                  r3 = $('#' + currentTab + ' #freq-slider-range-3').slider( "option", "values" );
              }

              $('#two-crystal-groups-tab .heatmap-container .heatmap-interaction').each(function(e) {
                  var rect = $(this);

                  // Generic numbering
                  var genNo1 = rect.data('gen-no-1');
                  var genNo2 = rect.data('gen-no-2');
                  if ((genNo1=='-') || (genNo2=='-')) return

                  // Link GN numbering to the shown structure
                  var resNo1 = pdb_data[mode][structureNumber]['only_gn'][pdb_data[mode][structureNumber]['gn_map'].indexOf(genNo1)];
                  var resNo2 = pdb_data[mode][structureNumber]['only_gn'][pdb_data[mode][structureNumber]['gn_map'].indexOf(genNo2)];
                  if ((typeof resNo1=='undefined') || (typeof resNo2=='undefined')) return

                  // Apply frequency cutoffs
                  var frequency = rect.data('frequencyDiff');
                  var f1 = rect.data('group-1Freq');
                  var f2 = rect.data('group-2Freq');

                  var pair = genNo1 + "," + genNo2;
                  if ( !(filtered_gn_pairs.includes(pair)) && filtered_gn_pairs.length) {
                      return
                  } 
                  // if ( (f1 < r1[0] || r1[1] < f1) || (f2 < r2[0] || r2[1] < f2) || (frequency < r3[0] || r3[1] < frequency) ) return

                  // Push interacting residues
                  if (!res_int.includes(resNo1)) res_int.push(resNo1)
                  if (!res_int.includes(resNo2)) res_int.push(resNo2)

                  // Only show the links for the most prevalent structure group
                  if ((structureNumber == 0 && frequency < 0) || (structureNumber == 1 && frequency >= 0)) return

                  // Fix atom IDs for GN loop interactions
                  if (resNo1 > resNo2){
                    tmp = resNo1;
                    resNo1 = resNo2;
                    resNo2 = tmp;
                    tmp = genNo1;
                    genNo1 = genNo2;
                    genNo2 = tmp;
                  }

                  links.push({"atoms": [resNo1+":"+pdb_data[mode][structureNumber]['chain']+".CA",resNo2+":"+pdb_data[mode][structureNumber]['chain']+".CA"], "data":{"color":getFrequencyColor(-1*frequency)}, "resID":resNo1+"-"+resNo2})
                  int_labels[mode][structureNumber][o.structure.id + "|" + resNo1+"-"+resNo2] = genNo1+" - "+genNo2
                });
            }

            links.forEach(function (link) {
              linkMap[mode][structureNumber][link.resID] = link
            })

            // create coloring scale for the links
            linkColourScheme[mode][structureNumber] = function () {
              this.bondColor = function (b) {
                var origLink = linkMap[mode][structureNumber][b.atom1.resno + "-" + b.atom2.resno]
                if (origLink) {
                  r = origLink.data.color
                  return (r["r"] << 16) + (r["g"] << 8) + r["b"]
                }
                return (8 << 16) + (8 << 8) + 8 // (128 << 16) + (128 << 8) + 128 // grey default
              }
            }
            reps[mode][structureNumber].linkColourScheme = NGL.ColormakerRegistry.addScheme(linkColourScheme[mode][structureNumber], "xlink")

            reps[mode][structureNumber].links = o.addRepresentation("distance", {
              atomPair: links.map(function (l) {
                return l.atoms
              }),
              colorScheme: reps[mode][structureNumber].linkColourScheme,
              useCylinder: true,
              radiusSize: 0.04,
              labelVisible: false,
              linewidth: 2,
              visible: true
            })

            // Empty? Update selection with a fake residue -> hide everything
            if (res_int.length == 0) res_int.push("9999999")

            if (update){
                reps[mode][structureNumber].int_res.setSelection(":"+pdb_data[mode][structureNumber]['chain']+" and ("+res_int.join(", ")+") and (.CA)")
                reps[mode][structureNumber].ball_int.setSelection(":"+pdb_data[mode][structureNumber]['chain']+" and ("+res_int.join(", ")+") and sidechainAttached")
            } else {
                reps[mode][structureNumber].int_res = o.addRepresentation( "spacefill", {
                  sele: ":"+pdb_data[mode][structureNumber]['chain']+" and ("+res_int.join(", ")+") and (.CA)",
                  color: (structureNumber==0 ? "#084081" : "#811808"),
                  // colorScale: ["#44f", "#444"],
                  radiusScale: .2,
                  name: "res",
                  visible: true
                });

                reps[mode][structureNumber].ball_int = o.addRepresentation("ball+stick", {
                  sele: ":"+pdb_data[mode][structureNumber]['chain']+" and ("+res_int.join(", ")+") and sidechainAttached",
                  color: "element",
                  colorValue: (structureNumber==0 ? "#99B5CC" : "#DDA8BC"),
                  visible: false
                  })
            }

            // update show/hide when updating representations
            if (update) updateStructureRepresentations(mode)
        }

        // TODO: make this function obsolete and merge remaining code with *createNGLRepresentations*
        function updateStructureRepresentations(mode) {
          console.log('updateStructureRepresentations');
          var structures = 1;
          if (mode=="two-groups")
            structures = 2;

          for (var key = 0; key < structures; key++) {

            hide_structure = $("#ngl-"+mode+" #hide_pdb"+(key+1)).prop('checked');
            var o = reps[mode][key].structureComponent;
            if (hide_structure) {
              o.setVisibility(false);
              break;
            } else {
              o.setVisibility(true);
            }
            // toggle edges
            reps[mode][key].links.setVisibility(!$("#ngl-"+mode+" #toggle_interactions").prop('checked'));

            // toggle CA spheres
            reps[mode][key].int_res.setVisibility($("#ngl-"+mode+" #highlight_res").prop('checked'));

            // toggle interacting toggle_sidechains
            reps[mode][key].ball_int.setVisibility($("#ngl-"+mode+" #toggle_sidechains_int").prop('checked'));

            // Update cartoon using selection
            checked = $("#ngl-"+mode+" #ngl_only_gns").prop('checked');
            sele = ":"+pdb_data[mode][key]['chain'];
            int_sele = sele
            if (checked)
              sele = ":"+pdb_data[mode][key]['chain']+" and ("+pdb_data[mode][key]['only_gn'].join(", ")+")";
              int_sele =

            gpcr_rep[mode][key].setSelection(sele);
          }
        }


        function redraw_ngl() {
          var mode = $('ul#mode_nav').find('li.active').find('a').text().trim();
          var mode = $('.ngl-container:visible').attr('id').replace('ngl-','');
          if (mode in stage){
            $(function() {
              stage[mode].handleResize();
            });
          }
        }

        function intersect(a, b) {
          var t;
          if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
          return a.filter(function (e) {
              return b.indexOf(e) > -1;
          });
        }

        $('#single-crystal-pdb-modal-table').on('shown.bs.modal', function (e) {
          showPDBtable('#single-crystal-pdb-modal-table');
        })
        $('#single-crystal-group-pdbs-modal-table').on('shown.bs.modal', function (e) {
          showPDBtable('#single-crystal-group-pdbs-modal-table');
        })
        $('#two-crystal-group-pdbs-modal-1-table').on('shown.bs.modal', function (e) {
          showPDBtable('#two-crystal-group-pdbs-modal-1-table');
        })
        $('#two-crystal-group-pdbs-modal-2-table').on('shown.bs.modal', function (e) {
          showPDBtable('#two-crystal-group-pdbs-modal-2-table');
        })


        function initializePdbChooserTables() {
          $.get('pdbtabledata', function ( data ) {
            $('#single-crystal-pdb-modal-table .tableview').html(data);
            $('#single-crystal-group-pdbs-modal-table .tableview').html(data);
            $('#two-crystal-group-pdbs-modal-1-table .tableview').html(data);
            $('#two-crystal-group-pdbs-modal-2-table .tableview').html(data);
            pdbtabledata = data;
          });
          $(".main_loading_overlay").hide();
        }


        function initalizeSingleCrystalView() {
//            initializeSegmentButtons('#single-crystal-tab');
            initializeGoButton('#single-crystal-tab', renderHeatmap);
            initializeFullscreenButton('#single-crystal-tab');
        }

        function initializeSingleGroupCrystalView() {
//            initializeSegmentButtons('#single-crystal-group-tab');
            initializeGoButton('#single-crystal-group-tab', renderHeatmap, true);
            initializeFullscreenButton('#single-crystal-group-tab');
            initializeInteractionButtons('#single-crystal-group-tab');
        }

        function initializeTwoCrystalGroupsView() {
//            initializeSegmentButtons('#two-crystal-groups-tab');
            initializeGoButtonTwoCrystalGroups('#two-crystal-groups-tab', renderHeatmap, true);
            initializeFullscreenButton('#two-crystal-groups-tab');
            initializeInteractionButtons('#two-crystal-groups-tab');
        }

        function updateMatrix() {
            switch (currentTab) {
                case "single-crystal-tab":
                    // $('#' + currentTab+ ' .controls-panel input[type=checkbox]').each(function() {
                    //     var interactionType = $(this).data('interaction-type');
                    //     var rects = $('#' + currentTab + ' .heatmap rect.' + interactionType);
                    //     if ($(this).is(':checked')) {
                    //         rects.show();
                    //     } else {
                    //         rects.hide();
                    //     }
                    // });

                    if (!filtered_gn_pairs.length) break;

                    // Hide all below min treshold
                    $('.tab-pane.main_option.active .heatmap .heatmap-interaction').each(function() {
                        var pair = $(this).data("res-no-1") + "," + $(this).data("res-no-2");
                        var pair_reverse = $(this).data("res-no-2") + "," + $(this).data("res-no-1");
                        if ( filtered_gn_pairs.includes(pair) || filtered_gn_pairs.includes(pair_reverse)) {
                            $(this).show();
                        } else {
                            $(this).hide();
                        }
                    });

                    break;
                case "single-crystal-group-tab":
                    // var [tMin,tMax] = $('#' + currentTab + '-crystal-tab #pdbs-range-slider').slider( "option", "values" );
                    var [tMin,tMax] = $('#pdbs-range-slider').slider( "option", "values" );

                    if (!filtered_gn_pairs.length) break;

                    // Hide all below min treshold
                    $('.tab-pane.main_option.active .heatmap .heatmap-interaction').each(function() {
                        var pair = $(this).data("gen-no-1") + "," + $(this).data("gen-no-2");
                        var pair_reverse = $(this).data("gen-no-2") + "," + $(this).data("gen-no-1");
                        if ( filtered_gn_pairs.includes(pair) || filtered_gn_pairs.includes(pair_reverse)) {
                            $(this).show();
                        } else {
                            $(this).hide();
                        }
                    });
                    break;
                case "two-crystal-groups-tab":

                  if (!filtered_gn_pairs.length) break;

                    $('.tab-pane.main_option.active .heatmap .heatmap-interaction').each(function() {
                        var pair = $(this).data("gen-no-1") + "," + $(this).data("gen-no-2");
                        var pair_reverse = $(this).data("gen-no-2") + "," + $(this).data("gen-no-1");
                        if ( filtered_gn_pairs.includes(pair) || filtered_gn_pairs.includes(pair_reverse)) {
                            $(this).show();
                        } else {
                            $(this).hide();
                        }
                    });
                    break;
            }
        }

        // TODO update for other tabs
        function updateFlareplot() {
            var container = '#' + currentTab+ ' .flareplot-container'


            switch (currentTab) {
                case "single-crystal-tab":
                // interactionsToggleList = [];
                // $('#' + currentTab+ ' .controls-panel input[type=checkbox]').each(function() {
                //     // init toggle list
                //     if ($(this).is(':checked'))
                //         interactionsToggleList.push($(this).data('interaction-type'));
                // });

                // // toggle interactions in flareplot
                // if (container in flareplot)
                //     flareplot[container].showInteractions(interactionsToggleList);
                if (!filtered_gn_pairs.length) break;

                    var paths = $(container + ' path').each(function() {
                      // var f1 = $(this).data("group-1-freq");
                      // var f2 = $(this).data("group-2-freq");
                      // var f3 = $(this).data("frequency-diff");
                      // if ( (f1 < r1[0] || r1[1] < f1) || (f2 < r2[0] || r2[1] < f2) || (f3 < r3[0] || r3[1] < f3) ) {
                      //     $(this).hide();
                      // } else {
                      //     $(this).show();
                      // }
                      if ($(this).attr("class")) {
                        var path_class = $(this).attr("class").split(' '); //[1].replace("edge-","")
                        var gn1 = path_class[1].replace("source-","");
                        var gn2 = path_class[2].replace("target-","");
                        var pair = gn1 +","+gn2;
                        // console.log(pair);
                        if ( filtered_gn_pairs.includes(pair) ) {
                            $(this).show();
                        } else {
                            $(this).hide();
                        }
                      }
                  });
                break;
                case "single-crystal-group-tab":
                    // var [tMin,tMax] = $('#' + currentTab + ' #pdbs-range-slider').slider( "option", "values" );
                    // if (container in flareplot)
                    //     flareplot[container].updateRange(tMin, tMax);
                    break;
                case "two-crystal-groups-tab":

                  if (!filtered_gn_pairs.length) break;

                    var paths = $(container + ' path').each(function() {
                      // var f1 = $(this).data("group-1-freq");
                      // var f2 = $(this).data("group-2-freq");
                      // var f3 = $(this).data("frequency-diff");
                      // if ( (f1 < r1[0] || r1[1] < f1) || (f2 < r2[0] || r2[1] < f2) || (f3 < r3[0] || r3[1] < f3) ) {
                      //     $(this).hide();
                      // } else {
                      //     $(this).show();
                      // }
                      if ($(this).attr("class")) {
                        var path_class = $(this).attr("class").split(' '); //[1].replace("edge-","")
                        var gn1 = path_class[1].replace("source-","");
                        var gn2 = path_class[2].replace("target-","");
                        var pair = gn1 +","+gn2;
                        // console.log(pair);
                        if ( filtered_gn_pairs.includes(pair) ) {
                            $(this).show();
                        } else {
                            $(this).hide();
                        }
                      }
                  });
                    break;
            }
        }

        // TODO create interaction toggle for Hiveplot
        function updateHiveplot() {
          // PLACEHOLDER
        }

        // TODO update for other tabs
        function updateSchematic() {
          switch (currentTab) {
              case "single-crystal-tab":
                  $('#' + currentTab+ ' .controls-panel input[type=checkbox]').each(function() {
                      var interactionType = $(this).data('interaction-type');
                      var paths = $('#' + currentTab+ '-crystal-tab  .' + currentViz + '-container path.' + interactionType);
                      if ($(this).is(':checked')) {
                          paths.show();
                      } else {
                          paths.hide();
                      }
                  });
                  break;
              case "single-crystal-group-tab":
                  var [tMin,tMax] = $('#' + currentTab + ' #pdbs-range-slider').slider( "option", "values" );

                  // Hide all below min treshold
                  var paths = $('#' + currentTab+ ' .' + currentViz + '-container path').each(function() {
                      var n = $(this).data("num-interactions");
                      if (n < tMin || tMax < n) {
                          $(this).hide();
                      } else {
                          $(this).show();
                      }
                  });
                  break;
              case "two-crystal-groups-tab":
                  // var r1 = $('#' + currentTab + '#freq-slider-range-1').slider( "option", "values" );
                  // var r2 = $('#' + currentTab + '#freq-slider-range-2').slider( "option", "values" );
                  // var r3 = $('#' + currentTab + '#freq-slider-range-3').slider( "option", "values" );

                  if (!filtered_gn_pairs.length) break;

                  // // Hide all below min or above treshold
                  var paths = $('#' + currentTab+ ' .' + currentViz + '-container path').each(function() {
                      // var f1 = $(this).data("group-1-freq");
                      // var f2 = $(this).data("group-2-freq");
                      // var f3 = $(this).data("frequency-diff");
                      // if ( (f1 < r1[0] || r1[1] < f1) || (f2 < r2[0] || r2[1] < f2) || (f3 < r3[0] || r3[1] < f3) ) {
                      //     $(this).hide();
                      // } else {
                      //     $(this).show();
                      // }
                      if ($(this).attr("class")) {
                        path_class = $(this).attr("class").split(' ')[1].replace("edge-","");
                        // console.log(path_class);
                        if ( filtered_gn_pairs.includes(path_class) ) {
                            $(this).show();
                        } else {
                            $(this).hide();
                        }

                      }
                  });
                  // $('#' + currentTab+ ' .' + currentViz + '-container path').hide();
                  // $.each(filtered_gn_pairs,function(i,v) {
                  //   console.log(v,'#' + currentTab+ ' .' + currentViz + '-container .edge-'+v,$('#' + currentTab+ ' .' + currentViz + '-container .edge-'+v));
                  //   $('#' + currentTab+ ' .' + currentViz + '-container .edge-'+v).show();
                  // });
                  break;
              }
        }

        function updateGeneralControls(ignore_ngl = false){
            // update current vizualization
            console.log('ignore_ngl',ignore_ngl);
            switch(currentViz.toLowerCase()) {
              case "matrix":
                updateMatrix()
                break;
              case "flareplot":
                updateFlareplot()
                break;
              case "hiveplot":
                updateHiveplot()
                break;
              case "schematic_con":
              case "schematic_non":
                updateSchematic()
                break;
              case "table":
                // do nothing
                break;
              case "ngl":
                // DEPRECATED: do nothing
                break;
              default:
                console.log("Error: missing representation update for " + currentViz)
            }

            // Always invoke NGL update
            if (!ignore_ngl) {
              // Do not update when simply changing viz tabs.
              createNGLRepresentations(currentTab , 0, currentTab)
              if (currentTab=="two-crystal-groups-tab") createNGLRepresentations(currentTab , 1, currentTab)
            }
        }

        var currentViz = "matrix";
        function updateCurrentTab(id){
            alt = $('.main_option:visible').attr('id');
            var now = id.replace("-link", "")
            now = now.replace("-tab", "")

            // update settings
            currentTab = now.substr(0,now.lastIndexOf('-'))
            currentViz = now.replace(currentTab+"-", "")
            currentTab = alt;
            redraw_renders();
        }