#!/usr/bin/env node
/**
 * pki-agent: an agent's identity on pki.sgit.ai, from the command line. One file, no dependencies, Node 18+.
 *
 *     curl -sO https://pki.sgit.ai/agents/pki-agent.mjs && node pki-agent.mjs help
 *
 * The agent makes its own key here; the private halves never leave the machine it runs on. What it hands out is its
 * public record, signed: an identity (kind "agent") and a link to the key that operates it. Its operator confirms it
 * from their vault (pki.sgit.ai/vault/, the Agents tab) with a link back, method "operates", and an end date; from
 * then until that date the register shows the agent as operated by them.
 *
 * Keys are kept where the sgit CLI keeps them (~/.sg-send/keys/sha256_<encryption fp>/, the same five files), so
 * `sgit pki` uses the same key; the private halves are encrypted with SG_SEND_PASSPHRASE when it is set (as sgit
 * does) and written plain, mode 0600, when it is not. The agent's own statements are kept in ~/.sg-send/pki/.
 * PKI_AGENT_HOME moves both; PKI_REGISTER points at another register (default https://pki.sgit.ai/).
 *
 * A key that must outlive one machine (a cloud session is a fresh container each time) travels as PKI_AGENT_KEY: the
 * output of `keyfile`, the two private halves encrypted with SG_SEND_PASSPHRASE, set as a secret in the environment
 * the agent runs in. Whoever sets that secret holds the key in custody; a session key avoids it altogether.
 *
 * Trust before a secret (v0.2.8): `send` and `seal` refuse a recipient that does not chain to a pinned root. The root
 * is one fingerprint the agent is given out of band (its instructions; `pin`, or PKI_ROOT), never the register's own
 * anchors.json, since whoever can change the site can change that file. When the pin names a domain, the root's
 * fingerprint must also be in a DNS TXT record at _pki.sgit.ai.<domain>, a second channel under another control.
 * The register is then read with the pinned key as the only anchor (directory.js trustFrom).
 *
 * THIS FILE is generated from this file and assets/people/ by admin/build/gen_agent_tool.mjs: the same
 * code the site runs, in one file.
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import zlib from 'zlib'
import { execFileSync } from 'child_process'

// ---------------------------------------------------------------- assets/vendor/qrcode-generator/2.0.4/qrcode.mjs (vendored, MIT)
const __qrcode = (() => {
//---------------------------------------------------------------------
//
// QR Code Generator for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//
// The word 'QR Code' is registered trademark of
// DENSO WAVE INCORPORATED
//  http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------

//---------------------------------------------------------------------
// qrcode
//---------------------------------------------------------------------

/**
 * qrcode
 * @param typeNumber 1 to 40
 * @param errorCorrectionLevel 'L','M','Q','H'
 */
const qrcode = function(typeNumber, errorCorrectionLevel) {

  const PAD0 = 0xEC;
  const PAD1 = 0x11;

  let _typeNumber = typeNumber;
  const _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
  let _modules = null;
  let _moduleCount = 0;
  let _dataCache = null;
  const _dataList = [];

  const _this = {};

  const makeImpl = function(test, maskPattern) {

    _moduleCount = _typeNumber * 4 + 17;
    _modules = function(moduleCount) {
      const modules = new Array(moduleCount);
      for (let row = 0; row < moduleCount; row += 1) {
        modules[row] = new Array(moduleCount);
        for (let col = 0; col < moduleCount; col += 1) {
          modules[row][col] = null;
        }
      }
      return modules;
    }(_moduleCount);

    setupPositionProbePattern(0, 0);
    setupPositionProbePattern(_moduleCount - 7, 0);
    setupPositionProbePattern(0, _moduleCount - 7);
    setupPositionAdjustPattern();
    setupTimingPattern();
    setupTypeInfo(test, maskPattern);

    if (_typeNumber >= 7) {
      setupTypeNumber(test);
    }

    if (_dataCache == null) {
      _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
    }

    mapData(_dataCache, maskPattern);
  };

  const setupPositionProbePattern = function(row, col) {

    for (let r = -1; r <= 7; r += 1) {

      if (row + r <= -1 || _moduleCount <= row + r) continue;

      for (let c = -1; c <= 7; c += 1) {

        if (col + c <= -1 || _moduleCount <= col + c) continue;

        if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )
            || (0 <= c && c <= 6 && (r == 0 || r == 6) )
            || (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
          _modules[row + r][col + c] = true;
        } else {
          _modules[row + r][col + c] = false;
        }
      }
    }
  };

  const getBestMaskPattern = function() {

    let minLostPoint = 0;
    let pattern = 0;

    for (let i = 0; i < 8; i += 1) {

      makeImpl(true, i);

      const lostPoint = QRUtil.getLostPoint(_this);

      if (i == 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }

    return pattern;
  };

  const setupTimingPattern = function() {

    for (let r = 8; r < _moduleCount - 8; r += 1) {
      if (_modules[r][6] != null) {
        continue;
      }
      _modules[r][6] = (r % 2 == 0);
    }

    for (let c = 8; c < _moduleCount - 8; c += 1) {
      if (_modules[6][c] != null) {
        continue;
      }
      _modules[6][c] = (c % 2 == 0);
    }
  };

  const setupPositionAdjustPattern = function() {

    const pos = QRUtil.getPatternPosition(_typeNumber);

    for (let i = 0; i < pos.length; i += 1) {

      for (let j = 0; j < pos.length; j += 1) {

        const row = pos[i];
        const col = pos[j];

        if (_modules[row][col] != null) {
          continue;
        }

        for (let r = -2; r <= 2; r += 1) {

          for (let c = -2; c <= 2; c += 1) {

            if (r == -2 || r == 2 || c == -2 || c == 2
                || (r == 0 && c == 0) ) {
              _modules[row + r][col + c] = true;
            } else {
              _modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  };

  const setupTypeNumber = function(test) {

    const bits = QRUtil.getBCHTypeNumber(_typeNumber);

    for (let i = 0; i < 18; i += 1) {
      const mod = (!test && ( (bits >> i) & 1) == 1);
      _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
    }

    for (let i = 0; i < 18; i += 1) {
      const mod = (!test && ( (bits >> i) & 1) == 1);
      _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  };

  const setupTypeInfo = function(test, maskPattern) {

    const data = (_errorCorrectionLevel << 3) | maskPattern;
    const bits = QRUtil.getBCHTypeInfo(data);

    // vertical
    for (let i = 0; i < 15; i += 1) {

      const mod = (!test && ( (bits >> i) & 1) == 1);

      if (i < 6) {
        _modules[i][8] = mod;
      } else if (i < 8) {
        _modules[i + 1][8] = mod;
      } else {
        _modules[_moduleCount - 15 + i][8] = mod;
      }
    }

    // horizontal
    for (let i = 0; i < 15; i += 1) {

      const mod = (!test && ( (bits >> i) & 1) == 1);

      if (i < 8) {
        _modules[8][_moduleCount - i - 1] = mod;
      } else if (i < 9) {
        _modules[8][15 - i - 1 + 1] = mod;
      } else {
        _modules[8][15 - i - 1] = mod;
      }
    }

    // fixed module
    _modules[_moduleCount - 8][8] = (!test);
  };

  const mapData = function(data, maskPattern) {

    let inc = -1;
    let row = _moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;
    const maskFunc = QRUtil.getMaskFunction(maskPattern);

    for (let col = _moduleCount - 1; col > 0; col -= 2) {

      if (col == 6) col -= 1;

      while (true) {

        for (let c = 0; c < 2; c += 1) {

          if (_modules[row][col - c] == null) {

            let dark = false;

            if (byteIndex < data.length) {
              dark = ( ( (data[byteIndex] >>> bitIndex) & 1) == 1);
            }

            const mask = maskFunc(row, col - c);

            if (mask) {
              dark = !dark;
            }

            _modules[row][col - c] = dark;
            bitIndex -= 1;

            if (bitIndex == -1) {
              byteIndex += 1;
              bitIndex = 7;
            }
          }
        }

        row += inc;

        if (row < 0 || _moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  };

  const createBytes = function(buffer, rsBlocks) {

    let offset = 0;

    let maxDcCount = 0;
    let maxEcCount = 0;

    const dcdata = new Array(rsBlocks.length);
    const ecdata = new Array(rsBlocks.length);

    for (let r = 0; r < rsBlocks.length; r += 1) {

      const dcCount = rsBlocks[r].dataCount;
      const ecCount = rsBlocks[r].totalCount - dcCount;

      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);

      dcdata[r] = new Array(dcCount);

      for (let i = 0; i < dcdata[r].length; i += 1) {
        dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
      }
      offset += dcCount;

      const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
      const rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);

      const modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i += 1) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = (modIndex >= 0)? modPoly.getAt(modIndex) : 0;
      }
    }

    let totalCodeCount = 0;
    for (let i = 0; i < rsBlocks.length; i += 1) {
      totalCodeCount += rsBlocks[i].totalCount;
    }

    const data = new Array(totalCodeCount);
    let index = 0;

    for (let i = 0; i < maxDcCount; i += 1) {
      for (let r = 0; r < rsBlocks.length; r += 1) {
        if (i < dcdata[r].length) {
          data[index] = dcdata[r][i];
          index += 1;
        }
      }
    }

    for (let i = 0; i < maxEcCount; i += 1) {
      for (let r = 0; r < rsBlocks.length; r += 1) {
        if (i < ecdata[r].length) {
          data[index] = ecdata[r][i];
          index += 1;
        }
      }
    }

    return data;
  };

  const createData = function(typeNumber, errorCorrectionLevel, dataList) {

    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);

    const buffer = qrBitBuffer();

    for (let i = 0; i < dataList.length; i += 1) {
      const data = dataList[i];
      buffer.put(data.getMode(), 4);
      buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
      data.write(buffer);
    }

    // calc num max data.
    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i += 1) {
      totalDataCount += rsBlocks[i].dataCount;
    }

    if (buffer.getLengthInBits() > totalDataCount * 8) {
      throw 'code length overflow. ('
        + buffer.getLengthInBits()
        + '>'
        + totalDataCount * 8
        + ')';
    }

    // end code
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    }

    // padding
    while (buffer.getLengthInBits() % 8 != 0) {
      buffer.putBit(false);
    }

    // padding
    while (true) {

      if (buffer.getLengthInBits() >= totalDataCount * 8) {
        break;
      }
      buffer.put(PAD0, 8);

      if (buffer.getLengthInBits() >= totalDataCount * 8) {
        break;
      }
      buffer.put(PAD1, 8);
    }

    return createBytes(buffer, rsBlocks);
  };

  _this.addData = function(data, mode) {

    mode = mode || 'Byte';

    let newData = null;

    switch(mode) {
    case 'Numeric' :
      newData = qrNumber(data);
      break;
    case 'Alphanumeric' :
      newData = qrAlphaNum(data);
      break;
    case 'Byte' :
      newData = qr8BitByte(data);
      break;
    case 'Kanji' :
      newData = qrKanji(data);
      break;
    default :
      throw 'mode:' + mode;
    }

    _dataList.push(newData);
    _dataCache = null;
  };

  _this.isDark = function(row, col) {
    if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
      throw row + ',' + col;
    }
    return _modules[row][col];
  };

  _this.getModuleCount = function() {
    return _moduleCount;
  };

  _this.make = function() {
    if (_typeNumber < 1) {
      let typeNumber = 1;

      for (; typeNumber < 40; typeNumber++) {
        const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel);
        const buffer = qrBitBuffer();

        for (let i = 0; i < _dataList.length; i++) {
          const data = _dataList[i];
          buffer.put(data.getMode(), 4);
          buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
          data.write(buffer);
        }

        let totalDataCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) {
          totalDataCount += rsBlocks[i].dataCount;
        }

        if (buffer.getLengthInBits() <= totalDataCount * 8) {
          break;
        }
      }

      _typeNumber = typeNumber;
    }

    makeImpl(false, getBestMaskPattern() );
  };

  _this.createTableTag = function(cellSize, margin) {

    cellSize = cellSize || 2;
    margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

    let qrHtml = '';

    qrHtml += '<table style="';
    qrHtml += ' border-width: 0px; border-style: none;';
    qrHtml += ' border-collapse: collapse;';
    qrHtml += ' padding: 0px; margin: ' + margin + 'px;';
    qrHtml += '">';
    qrHtml += '<tbody>';

    for (let r = 0; r < _this.getModuleCount(); r += 1) {

      qrHtml += '<tr>';

      for (let c = 0; c < _this.getModuleCount(); c += 1) {
        qrHtml += '<td style="';
        qrHtml += ' border-width: 0px; border-style: none;';
        qrHtml += ' border-collapse: collapse;';
        qrHtml += ' padding: 0px; margin: 0px;';
        qrHtml += ' width: ' + cellSize + 'px;';
        qrHtml += ' height: ' + cellSize + 'px;';
        qrHtml += ' background-color: ';
        qrHtml += _this.isDark(r, c)? '#000000' : '#ffffff';
        qrHtml += ';';
        qrHtml += '"/>';
      }

      qrHtml += '</tr>';
    }

    qrHtml += '</tbody>';
    qrHtml += '</table>';

    return qrHtml;
  };

  _this.createSvgTag = function(cellSize, margin, alt, title) {

    let opts = {};
    if (typeof arguments[0] == 'object') {
      // Called by options.
      opts = arguments[0];
      // overwrite cellSize and margin.
      cellSize = opts.cellSize;
      margin = opts.margin;
      alt = opts.alt;
      title = opts.title;
    }

    cellSize = cellSize || 2;
    margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

    // Compose alt property surrogate
    alt = (typeof alt === 'string') ? {text: alt} : alt || {};
    alt.text = alt.text || null;
    alt.id = (alt.text) ? alt.id || 'qrcode-description' : null;

    // Compose title property surrogate
    title = (typeof title === 'string') ? {text: title} : title || {};
    title.text = title.text || null;
    title.id = (title.text) ? title.id || 'qrcode-title' : null;

    const size = _this.getModuleCount() * cellSize + margin * 2;
    let c, mc, r, mr, qrSvg='', rect;

    rect = 'l' + cellSize + ',0 0,' + cellSize +
      ' -' + cellSize + ',0 0,-' + cellSize + 'z ';

    qrSvg += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"';
    qrSvg += !opts.scalable ? ' width="' + size + 'px" height="' + size + 'px"' : '';
    qrSvg += ' viewBox="0 0 ' + size + ' ' + size + '" ';
    qrSvg += ' preserveAspectRatio="xMinYMin meet"';
    qrSvg += (title.text || alt.text) ? ' role="img" aria-labelledby="' +
        escapeXml([title.id, alt.id].join(' ').trim() ) + '"' : '';
    qrSvg += '>';
    qrSvg += (title.text) ? '<title id="' + escapeXml(title.id) + '">' +
        escapeXml(title.text) + '</title>' : '';
    qrSvg += (alt.text) ? '<description id="' + escapeXml(alt.id) + '">' +
        escapeXml(alt.text) + '</description>' : '';
    qrSvg += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>';
    qrSvg += '<path d="';

    for (r = 0; r < _this.getModuleCount(); r += 1) {
      mr = r * cellSize + margin;
      for (c = 0; c < _this.getModuleCount(); c += 1) {
        if (_this.isDark(r, c) ) {
          mc = c*cellSize+margin;
          qrSvg += 'M' + mc + ',' + mr + rect;
        }
      }
    }

    qrSvg += '" stroke="transparent" fill="black"/>';
    qrSvg += '</svg>';

    return qrSvg;
  };

  _this.createDataURL = function(cellSize, margin) {

    cellSize = cellSize || 2;
    margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

    const size = _this.getModuleCount() * cellSize + margin * 2;
    const min = margin;
    const max = size - margin;

    return createDataURL(size, size, function(x, y) {
      if (min <= x && x < max && min <= y && y < max) {
        const c = Math.floor( (x - min) / cellSize);
        const r = Math.floor( (y - min) / cellSize);
        return _this.isDark(r, c)? 0 : 1;
      } else {
        return 1;
      }
    } );
  };

  _this.createImgTag = function(cellSize, margin, alt) {

    cellSize = cellSize || 2;
    margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

    const size = _this.getModuleCount() * cellSize + margin * 2;

    let img = '';
    img += '<img';
    img += '\u0020src="';
    img += _this.createDataURL(cellSize, margin);
    img += '"';
    img += '\u0020width="';
    img += size;
    img += '"';
    img += '\u0020height="';
    img += size;
    img += '"';
    if (alt) {
      img += '\u0020alt="';
      img += escapeXml(alt);
      img += '"';
    }
    img += '/>';

    return img;
  };

  const escapeXml = function(s) {
    let escaped = '';
    for (let i = 0; i < s.length; i += 1) {
      const c = s.charAt(i);
      switch(c) {
      case '<': escaped += '&lt;'; break;
      case '>': escaped += '&gt;'; break;
      case '&': escaped += '&amp;'; break;
      case '"': escaped += '&quot;'; break;
      default : escaped += c; break;
      }
    }
    return escaped;
  };

  const _createHalfASCII = function(margin) {
    const cellSize = 1;
    margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

    const size = _this.getModuleCount() * cellSize + margin * 2;
    const min = margin;
    const max = size - margin;

    let y, x, r1, r2, p;

    const blocks = {
      '██': '█',
      '█ ': '▀',
      ' █': '▄',
      '  ': ' '
    };

    const blocksLastLineNoMargin = {
      '██': '▀',
      '█ ': '▀',
      ' █': ' ',
      '  ': ' '
    };

    let ascii = '';
    for (y = 0; y < size; y += 2) {
      r1 = Math.floor((y - min) / cellSize);
      r2 = Math.floor((y + 1 - min) / cellSize);
      for (x = 0; x < size; x += 1) {
        p = '█';

        if (min <= x && x < max && min <= y && y < max && _this.isDark(r1, Math.floor((x - min) / cellSize))) {
          p = ' ';
        }

        if (min <= x && x < max && min <= y+1 && y+1 < max && _this.isDark(r2, Math.floor((x - min) / cellSize))) {
          p += ' ';
        }
        else {
          p += '█';
        }

        // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
        ascii += (margin < 1 && y+1 >= max) ? blocksLastLineNoMargin[p] : blocks[p];
      }

      ascii += '\n';
    }

    if (size % 2 && margin > 0) {
      return ascii.substring(0, ascii.length - size - 1) + Array(size+1).join('▀');
    }

    return ascii.substring(0, ascii.length-1);
  };

  _this.createASCII = function(cellSize, margin) {
    cellSize = cellSize || 1;

    if (cellSize < 2) {
      return _createHalfASCII(margin);
    }

    cellSize -= 1;
    margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

    const size = _this.getModuleCount() * cellSize + margin * 2;
    const min = margin;
    const max = size - margin;

    let y, x, r, p;

    const white = Array(cellSize+1).join('██');
    const black = Array(cellSize+1).join('  ');

    let ascii = '';
    let line = '';
    for (y = 0; y < size; y += 1) {
      r = Math.floor( (y - min) / cellSize);
      line = '';
      for (x = 0; x < size; x += 1) {
        p = 1;

        if (min <= x && x < max && min <= y && y < max && _this.isDark(r, Math.floor((x - min) / cellSize))) {
          p = 0;
        }

        // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
        line += p ? white : black;
      }

      for (r = 0; r < cellSize; r += 1) {
        ascii += line + '\n';
      }
    }

    return ascii.substring(0, ascii.length-1);
  };

  _this.renderTo2dContext = function(context, cellSize) {
    cellSize = cellSize || 2;
    const length = _this.getModuleCount();
    for (let row = 0; row < length; row++) {
      for (let col = 0; col < length; col++) {
        context.fillStyle = _this.isDark(row, col) ? 'black' : 'white';
        context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }

  return _this;
};

//---------------------------------------------------------------------
// qrcode.stringToBytes
//---------------------------------------------------------------------

qrcode.stringToBytes = function(s) {
  const bytes = [];
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    bytes.push(c & 0xff);
  }
  return bytes;
};

//---------------------------------------------------------------------
// qrcode.createStringToBytes
//---------------------------------------------------------------------

/**
 * @param unicodeData base64 string of byte array.
 * [16bit Unicode],[16bit Bytes], ...
 * @param numChars
 */
qrcode.createStringToBytes = function(unicodeData, numChars) {

  // create conversion map.

  const unicodeMap = function() {

    const bin = base64DecodeInputStream(unicodeData);
    const read = function() {
      const b = bin.read();
      if (b == -1) throw 'eof';
      return b;
    };

    let count = 0;
    const unicodeMap = {};
    while (true) {
      const b0 = bin.read();
      if (b0 == -1) break;
      const b1 = read();
      const b2 = read();
      const b3 = read();
      const k = String.fromCharCode( (b0 << 8) | b1);
      const v = (b2 << 8) | b3;
      unicodeMap[k] = v;
      count += 1;
    }
    if (count != numChars) {
      throw count + ' != ' + numChars;
    }

    return unicodeMap;
  }();

  const unknownChar = '?'.charCodeAt(0);

  return function(s) {
    const bytes = [];
    for (let i = 0; i < s.length; i += 1) {
      const c = s.charCodeAt(i);
      if (c < 128) {
        bytes.push(c);
      } else {
        const b = unicodeMap[s.charAt(i)];
        if (typeof b == 'number') {
          if ( (b & 0xff) == b) {
            // 1byte
            bytes.push(b);
          } else {
            // 2bytes
            bytes.push(b >>> 8);
            bytes.push(b & 0xff);
          }
        } else {
          bytes.push(unknownChar);
        }
      }
    }
    return bytes;
  };
};

//---------------------------------------------------------------------
// QRMode
//---------------------------------------------------------------------

const QRMode = {
  MODE_NUMBER :    1 << 0,
  MODE_ALPHA_NUM : 1 << 1,
  MODE_8BIT_BYTE : 1 << 2,
  MODE_KANJI :     1 << 3
};

//---------------------------------------------------------------------
// QRErrorCorrectionLevel
//---------------------------------------------------------------------

const QRErrorCorrectionLevel = {
  L : 1,
  M : 0,
  Q : 3,
  H : 2
};

//---------------------------------------------------------------------
// QRMaskPattern
//---------------------------------------------------------------------

const QRMaskPattern = {
  PATTERN000 : 0,
  PATTERN001 : 1,
  PATTERN010 : 2,
  PATTERN011 : 3,
  PATTERN100 : 4,
  PATTERN101 : 5,
  PATTERN110 : 6,
  PATTERN111 : 7
};

//---------------------------------------------------------------------
// QRUtil
//---------------------------------------------------------------------

const QRUtil = function() {

  const PATTERN_POSITION_TABLE = [
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66],
    [6, 26, 48, 70],
    [6, 26, 50, 74],
    [6, 30, 54, 78],
    [6, 30, 56, 82],
    [6, 30, 58, 86],
    [6, 34, 62, 90],
    [6, 28, 50, 72, 94],
    [6, 26, 50, 74, 98],
    [6, 30, 54, 78, 102],
    [6, 28, 54, 80, 106],
    [6, 32, 58, 84, 110],
    [6, 30, 58, 86, 114],
    [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122],
    [6, 30, 54, 78, 102, 126],
    [6, 26, 52, 78, 104, 130],
    [6, 30, 56, 82, 108, 134],
    [6, 34, 60, 86, 112, 138],
    [6, 30, 58, 86, 114, 142],
    [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150],
    [6, 24, 50, 76, 102, 128, 154],
    [6, 28, 54, 80, 106, 132, 158],
    [6, 32, 58, 84, 110, 136, 162],
    [6, 26, 54, 82, 110, 138, 166],
    [6, 30, 58, 86, 114, 142, 170]
  ];
  const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
  const G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
  const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

  const _this = {};

  const getBCHDigit = function(data) {
    let digit = 0;
    while (data != 0) {
      digit += 1;
      data >>>= 1;
    }
    return digit;
  };

  _this.getBCHTypeInfo = function(data) {
    let d = data << 10;
    while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
      d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15) ) );
    }
    return ( (data << 10) | d) ^ G15_MASK;
  };

  _this.getBCHTypeNumber = function(data) {
    let d = data << 12;
    while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
      d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18) ) );
    }
    return (data << 12) | d;
  };

  _this.getPatternPosition = function(typeNumber) {
    return PATTERN_POSITION_TABLE[typeNumber - 1];
  };

  _this.getMaskFunction = function(maskPattern) {

    switch (maskPattern) {

    case QRMaskPattern.PATTERN000 :
      return function(i, j) { return (i + j) % 2 == 0; };
    case QRMaskPattern.PATTERN001 :
      return function(i, j) { return i % 2 == 0; };
    case QRMaskPattern.PATTERN010 :
      return function(i, j) { return j % 3 == 0; };
    case QRMaskPattern.PATTERN011 :
      return function(i, j) { return (i + j) % 3 == 0; };
    case QRMaskPattern.PATTERN100 :
      return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0; };
    case QRMaskPattern.PATTERN101 :
      return function(i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
    case QRMaskPattern.PATTERN110 :
      return function(i, j) { return ( (i * j) % 2 + (i * j) % 3) % 2 == 0; };
    case QRMaskPattern.PATTERN111 :
      return function(i, j) { return ( (i * j) % 3 + (i + j) % 2) % 2 == 0; };

    default :
      throw 'bad maskPattern:' + maskPattern;
    }
  };

  _this.getErrorCorrectPolynomial = function(errorCorrectLength) {
    let a = qrPolynomial([1], 0);
    for (let i = 0; i < errorCorrectLength; i += 1) {
      a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0) );
    }
    return a;
  };

  _this.getLengthInBits = function(mode, type) {

    if (1 <= type && type < 10) {

      // 1 - 9

      switch(mode) {
      case QRMode.MODE_NUMBER    : return 10;
      case QRMode.MODE_ALPHA_NUM : return 9;
      case QRMode.MODE_8BIT_BYTE : return 8;
      case QRMode.MODE_KANJI     : return 8;
      default :
        throw 'mode:' + mode;
      }

    } else if (type < 27) {

      // 10 - 26

      switch(mode) {
      case QRMode.MODE_NUMBER    : return 12;
      case QRMode.MODE_ALPHA_NUM : return 11;
      case QRMode.MODE_8BIT_BYTE : return 16;
      case QRMode.MODE_KANJI     : return 10;
      default :
        throw 'mode:' + mode;
      }

    } else if (type < 41) {

      // 27 - 40

      switch(mode) {
      case QRMode.MODE_NUMBER    : return 14;
      case QRMode.MODE_ALPHA_NUM : return 13;
      case QRMode.MODE_8BIT_BYTE : return 16;
      case QRMode.MODE_KANJI     : return 12;
      default :
        throw 'mode:' + mode;
      }

    } else {
      throw 'type:' + type;
    }
  };

  _this.getLostPoint = function(qrcode) {

    const moduleCount = qrcode.getModuleCount();

    let lostPoint = 0;

    // LEVEL1

    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount; col += 1) {

        let sameCount = 0;
        const dark = qrcode.isDark(row, col);

        for (let r = -1; r <= 1; r += 1) {

          if (row + r < 0 || moduleCount <= row + r) {
            continue;
          }

          for (let c = -1; c <= 1; c += 1) {

            if (col + c < 0 || moduleCount <= col + c) {
              continue;
            }

            if (r == 0 && c == 0) {
              continue;
            }

            if (dark == qrcode.isDark(row + r, col + c) ) {
              sameCount += 1;
            }
          }
        }

        if (sameCount > 5) {
          lostPoint += (3 + sameCount - 5);
        }
      }
    };

    // LEVEL2

    for (let row = 0; row < moduleCount - 1; row += 1) {
      for (let col = 0; col < moduleCount - 1; col += 1) {
        let count = 0;
        if (qrcode.isDark(row, col) ) count += 1;
        if (qrcode.isDark(row + 1, col) ) count += 1;
        if (qrcode.isDark(row, col + 1) ) count += 1;
        if (qrcode.isDark(row + 1, col + 1) ) count += 1;
        if (count == 0 || count == 4) {
          lostPoint += 3;
        }
      }
    }

    // LEVEL3

    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount - 6; col += 1) {
        if (qrcode.isDark(row, col)
            && !qrcode.isDark(row, col + 1)
            &&  qrcode.isDark(row, col + 2)
            &&  qrcode.isDark(row, col + 3)
            &&  qrcode.isDark(row, col + 4)
            && !qrcode.isDark(row, col + 5)
            &&  qrcode.isDark(row, col + 6) ) {
          lostPoint += 40;
        }
      }
    }

    for (let col = 0; col < moduleCount; col += 1) {
      for (let row = 0; row < moduleCount - 6; row += 1) {
        if (qrcode.isDark(row, col)
            && !qrcode.isDark(row + 1, col)
            &&  qrcode.isDark(row + 2, col)
            &&  qrcode.isDark(row + 3, col)
            &&  qrcode.isDark(row + 4, col)
            && !qrcode.isDark(row + 5, col)
            &&  qrcode.isDark(row + 6, col) ) {
          lostPoint += 40;
        }
      }
    }

    // LEVEL4

    let darkCount = 0;

    for (let col = 0; col < moduleCount; col += 1) {
      for (let row = 0; row < moduleCount; row += 1) {
        if (qrcode.isDark(row, col) ) {
          darkCount += 1;
        }
      }
    }

    const ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
    lostPoint += ratio * 10;

    return lostPoint;
  };

  return _this;
}();

//---------------------------------------------------------------------
// QRMath
//---------------------------------------------------------------------

const QRMath = function() {

  const EXP_TABLE = new Array(256);
  const LOG_TABLE = new Array(256);

  // initialize tables
  for (let i = 0; i < 8; i += 1) {
    EXP_TABLE[i] = 1 << i;
  }
  for (let i = 8; i < 256; i += 1) {
    EXP_TABLE[i] = EXP_TABLE[i - 4]
      ^ EXP_TABLE[i - 5]
      ^ EXP_TABLE[i - 6]
      ^ EXP_TABLE[i - 8];
  }
  for (let i = 0; i < 255; i += 1) {
    LOG_TABLE[EXP_TABLE[i] ] = i;
  }

  const _this = {};

  _this.glog = function(n) {

    if (n < 1) {
      throw 'glog(' + n + ')';
    }

    return LOG_TABLE[n];
  };

  _this.gexp = function(n) {

    while (n < 0) {
      n += 255;
    }

    while (n >= 256) {
      n -= 255;
    }

    return EXP_TABLE[n];
  };

  return _this;
}();

//---------------------------------------------------------------------
// qrPolynomial
//---------------------------------------------------------------------

const qrPolynomial = function(num, shift) {

  if (typeof num.length == 'undefined') {
    throw num.length + '/' + shift;
  }

  const _num = function() {
    let offset = 0;
    while (offset < num.length && num[offset] == 0) {
      offset += 1;
    }
    const _num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i += 1) {
      _num[i] = num[i + offset];
    }
    return _num;
  }();

  const _this = {};

  _this.getAt = function(index) {
    return _num[index];
  };

  _this.getLength = function() {
    return _num.length;
  };

  _this.multiply = function(e) {

    const num = new Array(_this.getLength() + e.getLength() - 1);

    for (let i = 0; i < _this.getLength(); i += 1) {
      for (let j = 0; j < e.getLength(); j += 1) {
        num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i) ) + QRMath.glog(e.getAt(j) ) );
      }
    }

    return qrPolynomial(num, 0);
  };

  _this.mod = function(e) {

    if (_this.getLength() - e.getLength() < 0) {
      return _this;
    }

    const ratio = QRMath.glog(_this.getAt(0) ) - QRMath.glog(e.getAt(0) );

    const num = new Array(_this.getLength() );
    for (let i = 0; i < _this.getLength(); i += 1) {
      num[i] = _this.getAt(i);
    }

    for (let i = 0; i < e.getLength(); i += 1) {
      num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i) ) + ratio);
    }

    // recursive call
    return qrPolynomial(num, 0).mod(e);
  };

  return _this;
};

//---------------------------------------------------------------------
// QRRSBlock
//---------------------------------------------------------------------

const QRRSBlock = function() {

  const RS_BLOCK_TABLE = [

    // L
    // M
    // Q
    // H

    // 1
    [1, 26, 19],
    [1, 26, 16],
    [1, 26, 13],
    [1, 26, 9],

    // 2
    [1, 44, 34],
    [1, 44, 28],
    [1, 44, 22],
    [1, 44, 16],

    // 3
    [1, 70, 55],
    [1, 70, 44],
    [2, 35, 17],
    [2, 35, 13],

    // 4
    [1, 100, 80],
    [2, 50, 32],
    [2, 50, 24],
    [4, 25, 9],

    // 5
    [1, 134, 108],
    [2, 67, 43],
    [2, 33, 15, 2, 34, 16],
    [2, 33, 11, 2, 34, 12],

    // 6
    [2, 86, 68],
    [4, 43, 27],
    [4, 43, 19],
    [4, 43, 15],

    // 7
    [2, 98, 78],
    [4, 49, 31],
    [2, 32, 14, 4, 33, 15],
    [4, 39, 13, 1, 40, 14],

    // 8
    [2, 121, 97],
    [2, 60, 38, 2, 61, 39],
    [4, 40, 18, 2, 41, 19],
    [4, 40, 14, 2, 41, 15],

    // 9
    [2, 146, 116],
    [3, 58, 36, 2, 59, 37],
    [4, 36, 16, 4, 37, 17],
    [4, 36, 12, 4, 37, 13],

    // 10
    [2, 86, 68, 2, 87, 69],
    [4, 69, 43, 1, 70, 44],
    [6, 43, 19, 2, 44, 20],
    [6, 43, 15, 2, 44, 16],

    // 11
    [4, 101, 81],
    [1, 80, 50, 4, 81, 51],
    [4, 50, 22, 4, 51, 23],
    [3, 36, 12, 8, 37, 13],

    // 12
    [2, 116, 92, 2, 117, 93],
    [6, 58, 36, 2, 59, 37],
    [4, 46, 20, 6, 47, 21],
    [7, 42, 14, 4, 43, 15],

    // 13
    [4, 133, 107],
    [8, 59, 37, 1, 60, 38],
    [8, 44, 20, 4, 45, 21],
    [12, 33, 11, 4, 34, 12],

    // 14
    [3, 145, 115, 1, 146, 116],
    [4, 64, 40, 5, 65, 41],
    [11, 36, 16, 5, 37, 17],
    [11, 36, 12, 5, 37, 13],

    // 15
    [5, 109, 87, 1, 110, 88],
    [5, 65, 41, 5, 66, 42],
    [5, 54, 24, 7, 55, 25],
    [11, 36, 12, 7, 37, 13],

    // 16
    [5, 122, 98, 1, 123, 99],
    [7, 73, 45, 3, 74, 46],
    [15, 43, 19, 2, 44, 20],
    [3, 45, 15, 13, 46, 16],

    // 17
    [1, 135, 107, 5, 136, 108],
    [10, 74, 46, 1, 75, 47],
    [1, 50, 22, 15, 51, 23],
    [2, 42, 14, 17, 43, 15],

    // 18
    [5, 150, 120, 1, 151, 121],
    [9, 69, 43, 4, 70, 44],
    [17, 50, 22, 1, 51, 23],
    [2, 42, 14, 19, 43, 15],

    // 19
    [3, 141, 113, 4, 142, 114],
    [3, 70, 44, 11, 71, 45],
    [17, 47, 21, 4, 48, 22],
    [9, 39, 13, 16, 40, 14],

    // 20
    [3, 135, 107, 5, 136, 108],
    [3, 67, 41, 13, 68, 42],
    [15, 54, 24, 5, 55, 25],
    [15, 43, 15, 10, 44, 16],

    // 21
    [4, 144, 116, 4, 145, 117],
    [17, 68, 42],
    [17, 50, 22, 6, 51, 23],
    [19, 46, 16, 6, 47, 17],

    // 22
    [2, 139, 111, 7, 140, 112],
    [17, 74, 46],
    [7, 54, 24, 16, 55, 25],
    [34, 37, 13],

    // 23
    [4, 151, 121, 5, 152, 122],
    [4, 75, 47, 14, 76, 48],
    [11, 54, 24, 14, 55, 25],
    [16, 45, 15, 14, 46, 16],

    // 24
    [6, 147, 117, 4, 148, 118],
    [6, 73, 45, 14, 74, 46],
    [11, 54, 24, 16, 55, 25],
    [30, 46, 16, 2, 47, 17],

    // 25
    [8, 132, 106, 4, 133, 107],
    [8, 75, 47, 13, 76, 48],
    [7, 54, 24, 22, 55, 25],
    [22, 45, 15, 13, 46, 16],

    // 26
    [10, 142, 114, 2, 143, 115],
    [19, 74, 46, 4, 75, 47],
    [28, 50, 22, 6, 51, 23],
    [33, 46, 16, 4, 47, 17],

    // 27
    [8, 152, 122, 4, 153, 123],
    [22, 73, 45, 3, 74, 46],
    [8, 53, 23, 26, 54, 24],
    [12, 45, 15, 28, 46, 16],

    // 28
    [3, 147, 117, 10, 148, 118],
    [3, 73, 45, 23, 74, 46],
    [4, 54, 24, 31, 55, 25],
    [11, 45, 15, 31, 46, 16],

    // 29
    [7, 146, 116, 7, 147, 117],
    [21, 73, 45, 7, 74, 46],
    [1, 53, 23, 37, 54, 24],
    [19, 45, 15, 26, 46, 16],

    // 30
    [5, 145, 115, 10, 146, 116],
    [19, 75, 47, 10, 76, 48],
    [15, 54, 24, 25, 55, 25],
    [23, 45, 15, 25, 46, 16],

    // 31
    [13, 145, 115, 3, 146, 116],
    [2, 74, 46, 29, 75, 47],
    [42, 54, 24, 1, 55, 25],
    [23, 45, 15, 28, 46, 16],

    // 32
    [17, 145, 115],
    [10, 74, 46, 23, 75, 47],
    [10, 54, 24, 35, 55, 25],
    [19, 45, 15, 35, 46, 16],

    // 33
    [17, 145, 115, 1, 146, 116],
    [14, 74, 46, 21, 75, 47],
    [29, 54, 24, 19, 55, 25],
    [11, 45, 15, 46, 46, 16],

    // 34
    [13, 145, 115, 6, 146, 116],
    [14, 74, 46, 23, 75, 47],
    [44, 54, 24, 7, 55, 25],
    [59, 46, 16, 1, 47, 17],

    // 35
    [12, 151, 121, 7, 152, 122],
    [12, 75, 47, 26, 76, 48],
    [39, 54, 24, 14, 55, 25],
    [22, 45, 15, 41, 46, 16],

    // 36
    [6, 151, 121, 14, 152, 122],
    [6, 75, 47, 34, 76, 48],
    [46, 54, 24, 10, 55, 25],
    [2, 45, 15, 64, 46, 16],

    // 37
    [17, 152, 122, 4, 153, 123],
    [29, 74, 46, 14, 75, 47],
    [49, 54, 24, 10, 55, 25],
    [24, 45, 15, 46, 46, 16],

    // 38
    [4, 152, 122, 18, 153, 123],
    [13, 74, 46, 32, 75, 47],
    [48, 54, 24, 14, 55, 25],
    [42, 45, 15, 32, 46, 16],

    // 39
    [20, 147, 117, 4, 148, 118],
    [40, 75, 47, 7, 76, 48],
    [43, 54, 24, 22, 55, 25],
    [10, 45, 15, 67, 46, 16],

    // 40
    [19, 148, 118, 6, 149, 119],
    [18, 75, 47, 31, 76, 48],
    [34, 54, 24, 34, 55, 25],
    [20, 45, 15, 61, 46, 16]
  ];

  const qrRSBlock = function(totalCount, dataCount) {
    const _this = {};
    _this.totalCount = totalCount;
    _this.dataCount = dataCount;
    return _this;
  };

  const _this = {};

  const getRsBlockTable = function(typeNumber, errorCorrectionLevel) {

    switch(errorCorrectionLevel) {
    case QRErrorCorrectionLevel.L :
      return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
    case QRErrorCorrectionLevel.M :
      return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
    case QRErrorCorrectionLevel.Q :
      return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
    case QRErrorCorrectionLevel.H :
      return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
    default :
      return undefined;
    }
  };

  _this.getRSBlocks = function(typeNumber, errorCorrectionLevel) {

    const rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);

    if (typeof rsBlock == 'undefined') {
      throw 'bad rs block @ typeNumber:' + typeNumber +
          '/errorCorrectionLevel:' + errorCorrectionLevel;
    }

    const length = rsBlock.length / 3;

    const list = [];

    for (let i = 0; i < length; i += 1) {

      const count = rsBlock[i * 3 + 0];
      const totalCount = rsBlock[i * 3 + 1];
      const dataCount = rsBlock[i * 3 + 2];

      for (let j = 0; j < count; j += 1) {
        list.push(qrRSBlock(totalCount, dataCount) );
      }
    }

    return list;
  };

  return _this;
}();

//---------------------------------------------------------------------
// qrBitBuffer
//---------------------------------------------------------------------

const qrBitBuffer = function() {

  const _buffer = [];
  let _length = 0;

  const _this = {};

  _this.getBuffer = function() {
    return _buffer;
  };

  _this.getAt = function(index) {
    const bufIndex = Math.floor(index / 8);
    return ( (_buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
  };

  _this.put = function(num, length) {
    for (let i = 0; i < length; i += 1) {
      _this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
    }
  };

  _this.getLengthInBits = function() {
    return _length;
  };

  _this.putBit = function(bit) {

    const bufIndex = Math.floor(_length / 8);
    if (_buffer.length <= bufIndex) {
      _buffer.push(0);
    }

    if (bit) {
      _buffer[bufIndex] |= (0x80 >>> (_length % 8) );
    }

    _length += 1;
  };

  return _this;
};

//---------------------------------------------------------------------
// qrNumber
//---------------------------------------------------------------------

const qrNumber = function(data) {

  const _mode = QRMode.MODE_NUMBER;
  const _data = data;

  const _this = {};

  _this.getMode = function() {
    return _mode;
  };

  _this.getLength = function(buffer) {
    return _data.length;
  };

  _this.write = function(buffer) {

    const data = _data;

    let i = 0;

    while (i + 2 < data.length) {
      buffer.put(strToNum(data.substring(i, i + 3) ), 10);
      i += 3;
    }

    if (i < data.length) {
      if (data.length - i == 1) {
        buffer.put(strToNum(data.substring(i, i + 1) ), 4);
      } else if (data.length - i == 2) {
        buffer.put(strToNum(data.substring(i, i + 2) ), 7);
      }
    }
  };

  const strToNum = function(s) {
    let num = 0;
    for (let i = 0; i < s.length; i += 1) {
      num = num * 10 + chatToNum(s.charAt(i) );
    }
    return num;
  };

  const chatToNum = function(c) {
    if ('0' <= c && c <= '9') {
      return c.charCodeAt(0) - '0'.charCodeAt(0);
    }
    throw 'illegal char :' + c;
  };

  return _this;
};

//---------------------------------------------------------------------
// qrAlphaNum
//---------------------------------------------------------------------

const qrAlphaNum = function(data) {

  const _mode = QRMode.MODE_ALPHA_NUM;
  const _data = data;

  const _this = {};

  _this.getMode = function() {
    return _mode;
  };

  _this.getLength = function(buffer) {
    return _data.length;
  };

  _this.write = function(buffer) {

    const s = _data;

    let i = 0;

    while (i + 1 < s.length) {
      buffer.put(
        getCode(s.charAt(i) ) * 45 +
        getCode(s.charAt(i + 1) ), 11);
      i += 2;
    }

    if (i < s.length) {
      buffer.put(getCode(s.charAt(i) ), 6);
    }
  };

  const getCode = function(c) {

    if ('0' <= c && c <= '9') {
      return c.charCodeAt(0) - '0'.charCodeAt(0);
    } else if ('A' <= c && c <= 'Z') {
      return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    } else {
      switch (c) {
      case '\u0020' : return 36;
      case '$' : return 37;
      case '%' : return 38;
      case '*' : return 39;
      case '+' : return 40;
      case '-' : return 41;
      case '.' : return 42;
      case '/' : return 43;
      case ':' : return 44;
      default :
        throw 'illegal char :' + c;
      }
    }
  };

  return _this;
};

//---------------------------------------------------------------------
// qr8BitByte
//---------------------------------------------------------------------

const qr8BitByte = function(data) {

  const _mode = QRMode.MODE_8BIT_BYTE;
  const _data = data;
  const _bytes = qrcode.stringToBytes(data);

  const _this = {};

  _this.getMode = function() {
    return _mode;
  };

  _this.getLength = function(buffer) {
    return _bytes.length;
  };

  _this.write = function(buffer) {
    for (let i = 0; i < _bytes.length; i += 1) {
      buffer.put(_bytes[i], 8);
    }
  };

  return _this;
};

//---------------------------------------------------------------------
// qrKanji
//---------------------------------------------------------------------

const qrKanji = function(data) {

  const _mode = QRMode.MODE_KANJI;
  const _data = data;

  const stringToBytes = qrcode.stringToBytes;
  !function(c, code) {
    // self test for sjis support.
    const test = stringToBytes(c);
    if (test.length != 2 || ( (test[0] << 8) | test[1]) != code) {
      throw 'sjis not supported.';
    }
  }('\u53cb', 0x9746);

  const _bytes = stringToBytes(data);

  const _this = {};

  _this.getMode = function() {
    return _mode;
  };

  _this.getLength = function(buffer) {
    return ~~(_bytes.length / 2);
  };

  _this.write = function(buffer) {

    const data = _bytes;

    let i = 0;

    while (i + 1 < data.length) {

      let c = ( (0xff & data[i]) << 8) | (0xff & data[i + 1]);

      if (0x8140 <= c && c <= 0x9FFC) {
        c -= 0x8140;
      } else if (0xE040 <= c && c <= 0xEBBF) {
        c -= 0xC140;
      } else {
        throw 'illegal char at ' + (i + 1) + '/' + c;
      }

      c = ( (c >>> 8) & 0xff) * 0xC0 + (c & 0xff);

      buffer.put(c, 13);

      i += 2;
    }

    if (i < data.length) {
      throw 'illegal char at ' + (i + 1);
    }
  };

  return _this;
};

//=====================================================================
// GIF Support etc.
//

//---------------------------------------------------------------------
// byteArrayOutputStream
//---------------------------------------------------------------------

const byteArrayOutputStream = function() {

  const _bytes = [];

  const _this = {};

  _this.writeByte = function(b) {
    _bytes.push(b & 0xff);
  };

  _this.writeShort = function(i) {
    _this.writeByte(i);
    _this.writeByte(i >>> 8);
  };

  _this.writeBytes = function(b, off, len) {
    off = off || 0;
    len = len || b.length;
    for (let i = 0; i < len; i += 1) {
      _this.writeByte(b[i + off]);
    }
  };

  _this.writeString = function(s) {
    for (let i = 0; i < s.length; i += 1) {
      _this.writeByte(s.charCodeAt(i) );
    }
  };

  _this.toByteArray = function() {
    return _bytes;
  };

  _this.toString = function() {
    let s = '';
    s += '[';
    for (let i = 0; i < _bytes.length; i += 1) {
      if (i > 0) {
        s += ',';
      }
      s += _bytes[i];
    }
    s += ']';
    return s;
  };

  return _this;
};

//---------------------------------------------------------------------
// base64EncodeOutputStream
//---------------------------------------------------------------------

const base64EncodeOutputStream = function() {

  let _buffer = 0;
  let _buflen = 0;
  let _length = 0;
  let _base64 = '';

  const _this = {};

  const writeEncoded = function(b) {
    _base64 += String.fromCharCode(encode(b & 0x3f) );
  };

  const encode = function(n) {
    if (n < 0) {
      throw 'n:' + n;
    } else if (n < 26) {
      return 0x41 + n;
    } else if (n < 52) {
      return 0x61 + (n - 26);
    } else if (n < 62) {
      return 0x30 + (n - 52);
    } else if (n == 62) {
      return 0x2b;
    } else if (n == 63) {
      return 0x2f;
    } else {
      throw 'n:' + n;
    }
  };

  _this.writeByte = function(n) {

    _buffer = (_buffer << 8) | (n & 0xff);
    _buflen += 8;
    _length += 1;

    while (_buflen >= 6) {
      writeEncoded(_buffer >>> (_buflen - 6) );
      _buflen -= 6;
    }
  };

  _this.flush = function() {

    if (_buflen > 0) {
      writeEncoded(_buffer << (6 - _buflen) );
      _buffer = 0;
      _buflen = 0;
    }

    if (_length % 3 != 0) {
      // padding
      const padlen = 3 - _length % 3;
      for (let i = 0; i < padlen; i += 1) {
        _base64 += '=';
      }
    }
  };

  _this.toString = function() {
    return _base64;
  };

  return _this;
};

//---------------------------------------------------------------------
// base64DecodeInputStream
//---------------------------------------------------------------------

const base64DecodeInputStream = function(str) {

  const _str = str;
  let _pos = 0;
  let _buffer = 0;
  let _buflen = 0;

  const _this = {};

  _this.read = function() {

    while (_buflen < 8) {

      if (_pos >= _str.length) {
        if (_buflen == 0) {
          return -1;
        }
        throw 'unexpected end of file./' + _buflen;
      }

      const c = _str.charAt(_pos);
      _pos += 1;

      if (c == '=') {
        _buflen = 0;
        return -1;
      } else if (c.match(/^\s$/) ) {
        // ignore if whitespace.
        continue;
      }

      _buffer = (_buffer << 6) | decode(c.charCodeAt(0) );
      _buflen += 6;
    }

    const n = (_buffer >>> (_buflen - 8) ) & 0xff;
    _buflen -= 8;
    return n;
  };

  const decode = function(c) {
    if (0x41 <= c && c <= 0x5a) {
      return c - 0x41;
    } else if (0x61 <= c && c <= 0x7a) {
      return c - 0x61 + 26;
    } else if (0x30 <= c && c <= 0x39) {
      return c - 0x30 + 52;
    } else if (c == 0x2b) {
      return 62;
    } else if (c == 0x2f) {
      return 63;
    } else {
      throw 'c:' + c;
    }
  };

  return _this;
};

//---------------------------------------------------------------------
// gifImage (B/W)
//---------------------------------------------------------------------

const gifImage = function(width, height) {

  const _width = width;
  const _height = height;
  const _data = new Array(width * height);

  const _this = {};

  _this.setPixel = function(x, y, pixel) {
    _data[y * _width + x] = pixel;
  };

  _this.write = function(out) {

    //---------------------------------
    // GIF Signature

    out.writeString('GIF87a');

    //---------------------------------
    // Screen Descriptor

    out.writeShort(_width);
    out.writeShort(_height);

    out.writeByte(0x80); // 2bit
    out.writeByte(0);
    out.writeByte(0);

    //---------------------------------
    // Global Color Map

    // black
    out.writeByte(0x00);
    out.writeByte(0x00);
    out.writeByte(0x00);

    // white
    out.writeByte(0xff);
    out.writeByte(0xff);
    out.writeByte(0xff);

    //---------------------------------
    // Image Descriptor

    out.writeString(',');
    out.writeShort(0);
    out.writeShort(0);
    out.writeShort(_width);
    out.writeShort(_height);
    out.writeByte(0);

    //---------------------------------
    // Local Color Map

    //---------------------------------
    // Raster Data

    const lzwMinCodeSize = 2;
    const raster = getLZWRaster(lzwMinCodeSize);

    out.writeByte(lzwMinCodeSize);

    let offset = 0;

    while (raster.length - offset > 255) {
      out.writeByte(255);
      out.writeBytes(raster, offset, 255);
      offset += 255;
    }

    out.writeByte(raster.length - offset);
    out.writeBytes(raster, offset, raster.length - offset);
    out.writeByte(0x00);

    //---------------------------------
    // GIF Terminator
    out.writeString(';');
  };

  const bitOutputStream = function(out) {

    const _out = out;
    let _bitLength = 0;
    let _bitBuffer = 0;

    const _this = {};

    _this.write = function(data, length) {

      if ( (data >>> length) != 0) {
        throw 'length over';
      }

      while (_bitLength + length >= 8) {
        _out.writeByte(0xff & ( (data << _bitLength) | _bitBuffer) );
        length -= (8 - _bitLength);
        data >>>= (8 - _bitLength);
        _bitBuffer = 0;
        _bitLength = 0;
      }

      _bitBuffer = (data << _bitLength) | _bitBuffer;
      _bitLength = _bitLength + length;
    };

    _this.flush = function() {
      if (_bitLength > 0) {
        _out.writeByte(_bitBuffer);
      }
    };

    return _this;
  };

  const getLZWRaster = function(lzwMinCodeSize) {

    const clearCode = 1 << lzwMinCodeSize;
    const endCode = (1 << lzwMinCodeSize) + 1;
    let bitLength = lzwMinCodeSize + 1;

    // Setup LZWTable
    const table = lzwTable();

    for (let i = 0; i < clearCode; i += 1) {
      table.add(String.fromCharCode(i) );
    }
    table.add(String.fromCharCode(clearCode) );
    table.add(String.fromCharCode(endCode) );

    const byteOut = byteArrayOutputStream();
    const bitOut = bitOutputStream(byteOut);

    // clear code
    bitOut.write(clearCode, bitLength);

    let dataIndex = 0;

    let s = String.fromCharCode(_data[dataIndex]);
    dataIndex += 1;

    while (dataIndex < _data.length) {

      const c = String.fromCharCode(_data[dataIndex]);
      dataIndex += 1;

      if (table.contains(s + c) ) {

        s = s + c;

      } else {

        bitOut.write(table.indexOf(s), bitLength);

        if (table.size() < 0xfff) {

          if (table.size() == (1 << bitLength) ) {
            bitLength += 1;
          }

          table.add(s + c);
        }

        s = c;
      }
    }

    bitOut.write(table.indexOf(s), bitLength);

    // end code
    bitOut.write(endCode, bitLength);

    bitOut.flush();

    return byteOut.toByteArray();
  };

  const lzwTable = function() {

    const _map = {};
    let _size = 0;

    const _this = {};

    _this.add = function(key) {
      if (_this.contains(key) ) {
        throw 'dup key:' + key;
      }
      _map[key] = _size;
      _size += 1;
    };

    _this.size = function() {
      return _size;
    };

    _this.indexOf = function(key) {
      return _map[key];
    };

    _this.contains = function(key) {
      return typeof _map[key] != 'undefined';
    };

    return _this;
  };

  return _this;
};

const createDataURL = function(width, height, getPixel) {
  const gif = gifImage(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      gif.setPixel(x, y, getPixel(x, y) );
    }
  }

  const b = byteArrayOutputStream();
  gif.write(b);

  const base64 = base64EncodeOutputStream();
  const bytes = b.toByteArray();
  for (let i = 0; i < bytes.length; i += 1) {
    base64.writeByte(bytes[i]);
  }
  base64.flush();

  return 'data:image/gif;base64,' + base64;
};


const stringToBytes = qrcode.stringToBytes;

return { qrcode, stringToBytes }
})()

// ---------------------------------------------------------------- assets/people/keys.js
const __keys = (() => {
/**
 * keys.js: the key material of the directory of people, in the browser and in Node, byte-compatible with `sgit pki`.
 *
 * Everything here is Web Crypto and nothing else. Each construction was checked against sgit-ai v0.23.0 (the
 * PKI__Crypto and PKI__Key_Store classes it ships) by admin/build/test_people.mjs, which runs the sgit CLI on what
 * this file makes and makes what the CLI reads:
 *
 *   encryption pair     RSA-OAEP 4096, e = 65537, SHA-256                          (sgit: generate_encryption_key_pair)
 *   signing pair        ECDSA P-256, SHA-256, signatures raw r||s, 64 bytes        (sgit: sign / verify)
 *   fingerprint         "sha256:" + the first 16 hex of SHA-256 over the DER SPKI  (sgit: compute_fingerprint)
 *   public bundle       { v: 1, encrypt, sign, label, fingerprint, signing_fingerprint }   (sgit pki export)
 *   private halves      PKCS#8 PEM, passphrase-encrypted as PBES2: PBKDF2-HMAC-SHA256 and AES-256-CBC, the form
 *                       python-cryptography's BestAvailableEncryption writes and sgit's key store reads
 *   the envelope        sgit's hybrid v2: base64 of { v: 2, w, i, c[, s, f] }; a fresh AES-256-GCM key encrypts,
 *                       RSA-OAEP wraps it; s is the sender's ECDSA signature over c, f the sender's signing fingerprint
 *   statements          the register's: canonical bytes are `jq -cS 'del(.sig)'` plus the newline jq ends with; the
 *                       statement id is "sha256:" + SHA-256 over `jq -cS .` of the whole statement, sig included
 *
 * Records in the register are keyed by the SIGNING fingerprint (registry/params.json); sgit's key store folders are
 * named by the ENCRYPTION fingerprint. Both are in every bundle, and the code says which one it means.
 *
 * @module keys
 */
const te = new TextEncoder(), td = new TextDecoder()
const subtle = () => globalThis.crypto.subtle
const random = n => globalThis.crypto.getRandomValues(new Uint8Array(n))

// ------------------------------------------------------------ bytes
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')
const unhex = s => Uint8Array.from(String(s).match(/../g) || [], h => parseInt(h, 16))
function b64(bytes) { let s = ''; for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b); return btoa(s) }
function unb64(s) { const bin = atob(String(s).replace(/\s/g, '')); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out }
const b64url = bytes => b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const unb64url = s => unb64(String(s).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(s).length + 3) % 4))
const utf8 = s => te.encode(s)
const fromUtf8 = b => td.decode(b)
async function sha256(data) { return new Uint8Array(await subtle().digest('SHA-256', typeof data === 'string' ? te.encode(data) : data)) }
const sha256hex = async data => hex(await sha256(data))

// ------------------------------------------------------------ PEM, as python-cryptography writes it
function pem(der, label) {
    const body = b64(der).match(/.{1,64}/g).join('\n')
    return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----\n`
}
function unpem(text) {
    const m = /-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/.exec(String(text || ''))
    if (!m) throw new Error('not a PEM block')
    return { label: m[1], der: unb64(m[2]) }
}

/** sgit's fingerprint of a public key: SPKI bytes or a PEM. */
async function fingerprint(spkiOrPem) {
    const der = typeof spkiOrPem === 'string' ? unpem(spkiOrPem).der : new Uint8Array(spkiOrPem)
    return 'sha256:' + (await sha256hex(der)).slice(0, 16)
}
const FP = /^sha256:[0-9a-f]{16}$/
/** The folder name a record lives in: a ':' breaks Windows checkouts (registry/params.json, record_dirname). */
const dirOf = fp => String(fp).replace(':', '-')
const fpOfDir = d => String(d).replace(/^sha256-/, 'sha256:')

// ------------------------------------------------------------ algorithms
const RSA_GEN = { name: 'RSA-OAEP', modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }
const RSA = { name: 'RSA-OAEP', hash: 'SHA-256' }
const EC = { name: 'ECDSA', namedCurve: 'P-256' }
const ECDSA = { name: 'ECDSA', hash: 'SHA-256' }

const importEncPublic = spki => subtle().importKey('spki', spki, RSA, false, ['encrypt'])
const importEncPrivate = pkcs8 => subtle().importKey('pkcs8', pkcs8, RSA, false, ['decrypt'])
const importSignPublic = spki => subtle().importKey('spki', spki, EC, false, ['verify'])
const importSignPrivate = pkcs8 => subtle().importKey('pkcs8', pkcs8, EC, false, ['sign'])

// ------------------------------------------------------------ the identity: two pairs, one bundle
/**
 * A new identity, made here: { bundle, private: { encrypt, sign } (PKCS#8 bytes), created }.
 * RSA-4096 generation takes a few seconds in a browser; the caller says so on the page.
 */
async function generate(label = '') {
    const enc = await subtle().generateKey(RSA_GEN, true, ['encrypt', 'decrypt'])
    const sig = await subtle().generateKey(EC, true, ['sign', 'verify'])
    const encSpki = new Uint8Array(await subtle().exportKey('spki', enc.publicKey))
    const sigSpki = new Uint8Array(await subtle().exportKey('spki', sig.publicKey))
    return {
        bundle: await bundleOf(encSpki, sigSpki, label),
        private: { encrypt: new Uint8Array(await subtle().exportKey('pkcs8', enc.privateKey)), sign: new Uint8Array(await subtle().exportKey('pkcs8', sig.privateKey)) },
        created: Date.now(),
    }
}
/** The public bundle, in the shape `sgit pki export` emits. */
async function bundleOf(encSpki, sigSpki, label = '') {
    return { v: 1, encrypt: pem(encSpki, 'PUBLIC KEY'), sign: pem(sigSpki, 'PUBLIC KEY'), label: String(label || ''),
             fingerprint: await fingerprint(encSpki), signing_fingerprint: await fingerprint(sigSpki) }
}
/** A bundle checked: both keys parse as what they claim, and both fingerprints are theirs. Returns a list of problems. */
async function checkBundle(bundle) {
    const out = []
    if (!bundle || bundle.v !== 1) return ['not a v1 public-key bundle']
    try { await importEncPublic(unpem(bundle.encrypt).der) } catch (e) { out.push('the encryption key is not an RSA-OAEP public key') }
    try { await importSignPublic(unpem(bundle.sign).der) } catch (e) { out.push('the signing key is not an ECDSA P-256 public key') }
    if (out.length) return out
    if (await fingerprint(bundle.encrypt) !== bundle.fingerprint) out.push('fingerprint is not the encryption key’s')
    if (await fingerprint(bundle.sign) !== bundle.signing_fingerprint) out.push('signing_fingerprint is not the signing key’s')
    const { modulusLength } = (await subtle().importKey('spki', unpem(bundle.encrypt).der, RSA, true, ['encrypt'])).algorithm
    if (modulusLength < 3072) out.push(`the encryption key is ${modulusLength}-bit; sgit makes 4096`)
    return out
}
/** The public halves recomputed from the private ones (so an import needs only the two private PEMs). */
async function publicFromPrivate(encPkcs8, signPkcs8, label = '') {
    const ej = await subtle().exportKey('jwk', await subtle().importKey('pkcs8', encPkcs8, RSA, true, ['decrypt']))
    const sj = await subtle().exportKey('jwk', await subtle().importKey('pkcs8', signPkcs8, EC, true, ['sign']))
    const encPub = await subtle().importKey('jwk', { kty: 'RSA', n: ej.n, e: ej.e, alg: 'RSA-OAEP-256', ext: true }, RSA, true, ['encrypt'])
    const sigPub = await subtle().importKey('jwk', { kty: 'EC', crv: 'P-256', x: sj.x, y: sj.y, ext: true }, EC, true, ['verify'])
    return bundleOf(new Uint8Array(await subtle().exportKey('spki', encPub)), new Uint8Array(await subtle().exportKey('spki', sigPub)), label)
}

// ------------------------------------------------------------ DER, as much as PBES2 needs
function derLen(n) { if (n < 128) return [n]; const b = []; while (n) { b.unshift(n & 255); n >>= 8 } return [0x80 | b.length, ...b] }
const tlv = (tag, body) => Uint8Array.from([tag, ...derLen(body.length), ...body])
const seq = (...parts) => tlv(0x30, concat(...parts))
const octets = b => tlv(0x04, b)
function int(n) { const b = []; do { b.unshift(n & 255); n = Math.floor(n / 256) } while (n); if (b[0] & 0x80) b.unshift(0); return tlv(0x02, Uint8Array.from(b)) }
function oid(dotted) {
    const p = dotted.split('.').map(Number), out = [40 * p[0] + p[1]]
    for (const v of p.slice(2)) { const s = [v & 127]; let x = v >> 7; while (x) { s.unshift(0x80 | (x & 127)); x >>= 7 } out.push(...s) }
    return tlv(0x06, Uint8Array.from(out))
}
const NULL = Uint8Array.from([0x05, 0x00])
function concat(...parts) { const n = parts.reduce((s, p) => s + p.length, 0), out = new Uint8Array(n); let i = 0; for (const p of parts) { out.set(p, i); i += p.length } return out }
/** One TLV at offset: { tag, start (of content), end, kids() }. */
function read(buf, at = 0) {
    const tag = buf[at]; let len = buf[at + 1], i = at + 2
    if (len & 0x80) { const n = len & 127; len = 0; for (let k = 0; k < n; k++) len = len * 256 + buf[i++] }
    const node = { tag, start: i, end: i + len, bytes: buf.subarray(i, i + len) }
    node.kids = () => { const out = []; let p = node.start; while (p < node.end) { const k = read(buf, p); out.push(k); p = k.end } return out }
    return node
}
function oidText(bytes) {
    const out = [Math.floor(bytes[0] / 40), bytes[0] % 40]; let v = 0
    for (const b of bytes.subarray(1)) { v = v * 128 + (b & 127); if (!(b & 0x80)) { out.push(v); v = 0 } }
    return out.join('.')
}
const intOf = bytes => [...bytes].reduce((s, b) => s * 256 + b, 0)
const OID = { pbes2: '1.2.840.113549.1.5.13', pbkdf2: '1.2.840.113549.1.5.12', hmacSha256: '1.2.840.113549.2.9', hmacSha1: '1.2.840.113549.2.7',
              aes256cbc: '2.16.840.1.101.3.4.1.42', aes128cbc: '2.16.840.1.101.3.4.1.2' }

/**
 * A PKCS#8 private key encrypted with a passphrase, as "ENCRYPTED PRIVATE KEY" PEM: PBES2, PBKDF2-HMAC-SHA256,
 * AES-256-CBC. python-cryptography (and so sgit's key store) reads it; the iteration count is in the file.
 */
async function encryptPrivate(pkcs8, passphrase, iterations = 210000) {
    if (!passphrase) throw new Error('a passphrase is required: sgit keeps private keys encrypted at rest')
    const salt = random(16), iv = random(16)
    const base = await subtle().importKey('raw', te.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
    const key = await subtle().deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, base, { name: 'AES-CBC', length: 256 }, false, ['encrypt'])
    const ct = new Uint8Array(await subtle().encrypt({ name: 'AES-CBC', iv }, key, pkcs8))
    const alg = seq(oid(OID.pbes2), seq(seq(oid(OID.pbkdf2), seq(octets(salt), int(iterations), seq(oid(OID.hmacSha256), NULL))), seq(oid(OID.aes256cbc), octets(iv))))
    return pem(seq(alg, octets(ct)), 'ENCRYPTED PRIVATE KEY')
}
/** The reverse, for sgit's own files (and for a plain "PRIVATE KEY" PEM, which needs no passphrase). PKCS#8 bytes out. */
async function decryptPrivate(text, passphrase) {
    const { label, der } = unpem(text)
    if (label === 'PRIVATE KEY') return der
    if (label !== 'ENCRYPTED PRIVATE KEY') throw new Error(`a ${label.toLowerCase()} PEM is not a PKCS#8 private key`)
    const [alg, data] = read(der).kids()
    const [algId, params] = alg.kids()
    if (oidText(algId.bytes) !== OID.pbes2) throw new Error('only PBES2-encrypted keys are read here (sgit writes PBES2)')
    const [kdf, enc] = params.kids()
    const [kdfId, kdfParams] = kdf.kids()
    if (oidText(kdfId.bytes) !== OID.pbkdf2) throw new Error('only PBKDF2 is read here')
    const kp = kdfParams.kids()
    const salt = kp[0].bytes, iterations = intOf(kp[1].bytes)
    const prfNode = kp.find(k => k.tag === 0x30)
    const prf = prfNode ? oidText(prfNode.kids()[0].bytes) : OID.hmacSha1
    const hash = prf === OID.hmacSha256 ? 'SHA-256' : prf === OID.hmacSha1 ? 'SHA-1' : null
    if (!hash) throw new Error('unknown PBKDF2 hash')
    const [encId, ivNode] = enc.kids()
    const cipher = oidText(encId.bytes), length = cipher === OID.aes256cbc ? 256 : cipher === OID.aes128cbc ? 128 : 0
    if (!length) throw new Error('only AES-CBC-encrypted keys are read here')
    const base = await subtle().importKey('raw', te.encode(passphrase || ''), 'PBKDF2', false, ['deriveKey'])
    const key = await subtle().deriveKey({ name: 'PBKDF2', hash, salt, iterations }, base, { name: 'AES-CBC', length }, false, ['decrypt'])
    try { return new Uint8Array(await subtle().decrypt({ name: 'AES-CBC', iv: ivNode.bytes }, key, data.bytes)) }
    catch (e) { throw new Error('wrong passphrase, or not this key') }
}

// ------------------------------------------------------------ sgit's key store, on disk
/**
 * The five files of one key in sgit's key store (~/.sg-send/keys/sha256_<encryption fp>/), private halves encrypted
 * with the passphrase. Returns { folder, files: { name: text } }.
 */
async function keystoreFiles(identity, passphrase) {
    const b = identity.bundle
    return {
        folder: b.fingerprint.replace(':', '_'),
        files: {
            'metadata.json': JSON.stringify({ label: b.label, algorithm: 'RSA-OAEP', key_size: 4096, encryption_fingerprint: b.fingerprint,
                                              signing_fingerprint: b.signing_fingerprint, created: identity.created || 0 }, null, 2),
            'private_key.pem': await encryptPrivate(identity.private.encrypt, passphrase),
            'public_key.pem': b.encrypt,
            'signing_private.pem': await encryptPrivate(identity.private.sign, passphrase),
            'signing_public.pem': b.sign,
        },
    }
}
/** A shell script that writes those files where sgit looks for them. Plain text; the private halves stay encrypted. */
function keystoreScript({ folder, files }) {
    const lines = ['#!/bin/sh', '# Writes one key into sgit\'s key store. Made by pki.sgit.ai in your browser; the private halves are', '# encrypted with your passphrase, which this file does not contain. Then: sgit pki list', 'set -e',
        `D="$HOME/.sg-send/keys/${folder}"`, 'mkdir -p "$D"', 'chmod 700 "$HOME/.sg-send/keys" "$D" 2>/dev/null || true']
    for (const [name, text] of Object.entries(files)) lines.push(`cat > "$D/${name}" <<'SGIT_PKI_EOF'`, text.replace(/\n$/, ''), 'SGIT_PKI_EOF')
    lines.push('chmod 600 "$D/private_key.pem" "$D/signing_private.pem"', `echo "written: $D"`)
    return lines.join('\n') + '\n'
}
/** An identity from sgit's two private PEMs (and the passphrase): the public bundle is recomputed, not trusted. */
async function importKeystore({ privateKeyPem, signingPrivatePem, passphrase, label = '', created = 0 }) {
    const encrypt = await decryptPrivate(privateKeyPem, passphrase), sign = await decryptPrivate(signingPrivatePem, passphrase)
    return { bundle: await publicFromPrivate(encrypt, sign, label), private: { encrypt, sign }, created }
}

// ------------------------------------------------------------ signatures
async function signBytes(signPkcs8, bytes) { return new Uint8Array(await subtle().sign(ECDSA, await importSignPrivate(signPkcs8), bytes)) }
async function verifyBytes(signPemOrSpki, sigRaw, bytes) {
    try {
        const spki = typeof signPemOrSpki === 'string' ? unpem(signPemOrSpki).der : signPemOrSpki
        if (sigRaw.length !== 64) return false
        return await subtle().verify(ECDSA, await importSignPublic(spki), sigRaw, bytes)
    } catch (e) { return false }
}

// ------------------------------------------------------------ statements: the register's canonical form
/** Recursively key-sorted compact JSON: jq -cS, byte for byte, for the values a statement may hold. */
function canon(v) {
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']'
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'
    if (typeof v === 'number' && !Number.isInteger(v)) throw new Error('statements carry no non-integer numbers (registry/params.json)')
    return JSON.stringify(v)
}
const canonicalBytes = st => { const { sig, ...rest } = st; return te.encode(canon(rest) + '\n') }
const statementId = async st => 'sha256:' + await sha256hex(te.encode(canon(st) + '\n'))
async function signStatement(st, signPkcs8) { const { sig, ...rest } = st; return { ...rest, sig: b64(await signBytes(signPkcs8, canonicalBytes(rest))) } }
async function verifyStatement(st, signPem) {
    if (!st || typeof st.sig !== 'string') return false
    let raw; try { raw = unb64(st.sig) } catch (e) { return false }
    return verifyBytes(signPem, raw, canonicalBytes(st))
}

// ------------------------------------------------------------ the envelope: sgit's hybrid v2
/**
 * Seal bytes (or text) to a bundle's encryption key. With a signer ({ sign: PKCS#8, fingerprint: signing fp }) it
 * carries s and f exactly as `sgit pki encrypt --fingerprint` does. Returns the .enc text (base64 of the JSON).
 */
async function seal(bundle, data, signer = null) {
    const pub = await importEncPublic(unpem(bundle.encrypt).der)
    const aes = await subtle().generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
    const iv = random(12)
    const c = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, aes, typeof data === 'string' ? te.encode(data) : data))
    const w = new Uint8Array(await subtle().encrypt(RSA, pub, new Uint8Array(await subtle().exportKey('raw', aes))))
    const env = { v: 2, w: b64(w), i: b64(iv), c: b64(c) }
    if (signer) { env.s = b64(await signBytes(signer.sign, c)); env.f = signer.fingerprint }
    return btoa(JSON.stringify(env))
}
/** The envelope as an object, from the .enc text. */
function parseEnvelope(enc) {
    let env; try { env = JSON.parse(atob(String(enc).trim())) } catch (e) { throw new Error('not an sgit envelope') }
    if (!env || ![1, 2].includes(env.v) || !env.w || !env.i || !env.c) throw new Error('not an sgit envelope')
    return env
}
/**
 * Open an envelope with a private encryption key (PKCS#8). Returns { bytes, text, signed, signer, verified }:
 * verified is true or false only when the signer's bundle was given (signerBundles: [bundle]); otherwise null,
 * which means "not checked" and must never be shown as "forged".
 */
async function unseal(encPkcs8, enc, signerBundles = []) {
    const env = parseEnvelope(enc)
    let raw
    try { raw = await subtle().decrypt(RSA, await importEncPrivate(encPkcs8), unb64(env.w)) } catch (e) { throw new Error('not sealed to this key') }
    const aes = await subtle().importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt'])
    let bytes
    try { bytes = new Uint8Array(await subtle().decrypt({ name: 'AES-GCM', iv: unb64(env.i), tagLength: 128 }, aes, unb64(env.c))) }
    catch (e) { throw new Error('changed on the way: the ciphertext does not check') }
    const out = { bytes, text: null, signed: !!(env.s && env.f), signer: env.f || null, verified: null }
    try { out.text = new TextDecoder('utf-8', { fatal: true }).decode(bytes) } catch (e) { out.text = null }
    if (out.signed) {
        const b = signerBundles.find(x => x && x.signing_fingerprint === env.f)
        if (b) out.verified = await verifyBytes(b.sign, unb64(env.s), unb64(env.c))
    }
    return out
}

return { hex, unhex, b64, unb64, b64url, unb64url, utf8, fromUtf8, sha256, sha256hex, pem, unpem, fingerprint, FP, dirOf, fpOfDir, RSA_GEN, RSA, EC, ECDSA, generate, bundleOf, checkBundle, publicFromPrivate, concat, encryptPrivate, decryptPrivate, keystoreFiles, keystoreScript, importKeystore, signBytes, verifyBytes, canon, canonicalBytes, statementId, signStatement, verifyStatement, seal, parseEnvelope, unseal }
})()

// ---------------------------------------------------------------- assets/people/directory.js
const __directory = (() => {
/**
 * directory.js: what a person's record says, and what the register computes from everybody's records.
 *
 * A record is a folder of signed statements, all by one key, all about that key (rule 1: only the owner writes to
 * their own record). The statement envelope is the register's own, unchanged since v0.1.x:
 *
 *     { v: 1, type, registry: "pki.sgit.ai", record, signer, created_at, body, sig }
 *
 * with record === signer === the signing fingerprint of the identity's bundle. The types a person's record uses:
 *
 *   identity     body { kind: "person" | "agent", name, bundle, about?, runtime?, session?, private_key_published }
 *                                                                                         exactly one, the first
 *   evidence     body { kind: website | github | dns | key | link, value, url? }        a claim that an account is theirs
 *   link         body { to: <fingerprint>, method?, on?, until?, policy? }               "I know the owner of that key"
 *   inbox        body { endpoint, vault, token }                                         where to write to them (an append lane)
 *   revocation   body { revokes: { record, statement }, reason, effective_from }        withdraws one of their own statements,
 *                                                                                         or the identity itself (rule 2)
 *
 * The rule that answers 2019: a link is a statement in the linker's record, never in the other person's. A LINK
 * EXISTS ONLY WHEN BOTH RECORDS HOLD ONE, EACH POINTING AT THE OTHER, NEITHER WITHDRAWN. A one-way link is a claim in
 * the claimant's record and adds nothing to the other person. A verification is a link from an anchor that names a
 * method (in person, a video call, a channel already known to be theirs); it is complete when the person links back.
 * A verification has a date and an end: `until` (yyyy-mm-dd), or a year after `on` when it names none. After it, the
 * person is linked but no longer verified, and the page asks for a re-verification: a new link statement, which
 * replaces the old one. Degrees of separation are computed from the records each time and never stored (rule: a view,
 * not a fact).
 *
 * Agents are records like people's (kind "agent"). An agent is OPERATED by a key when that key's record links to it
 * with method "operates" (and an end date: agents are verified for days or weeks, not a year) and the agent's record
 * links back (method "operated-by"): the same two-way rule. The operator can be a person, or an agent the person
 * operates (a fleet key, so that a person running hundreds of agents does not fill their own record); the chain is
 * followed up to three steps to the person at its root, whose standing the agent's page shows.
 *
 * A link to an agent can name a policy: `policy` is "sha256:<64 hex>" of the behaviour policy the operator authorises
 * it under (operates), or the agent says it runs under (operated-by). The register keeps the hash, never the text; the
 * operator's is the authorisation, the agent's a claim, and trustFrom reports both and whether they agree.
 *
 * Trust from a pinned root (trustFrom): an agent about to seal a secret must not take the register's word for who the
 * anchors are, because whoever can change the site can change anchors.json. It pins one fingerprint, given to it out of
 * band (its instructions, a DNS TXT record), builds the graph with that key as the only anchor, and asks whether the
 * recipient is the root, verified by the root, a persona of it, or an agent operated, in date, by a chain whose person
 * at the top is the root or verified by it.
 *
 * Personas are a person's other keys (for work, for a project, for a pseudonym): records of kind "person" like any other,
 * tied to the person's master key by the same two-way rule. The master's record links to the persona with method
 * "persona", and the persona's record links back with "persona-of". Either side alone is a claim; both together say
 * one person holds both keys, and the persona's page shows the master's standing, not a standing of its own. A persona
 * that wants to be verified in its own right is verified like anyone else, and that wins.
 *
 * Bounds (rule 3): 16 KiB a statement, 256 statements a record, 150 live links to people and 200 to operated agents
 * a record, 32 live evidence items.
 *
 * Pure functions over parsed JSON and keys.js; runs in the browser and in Node (admin/build/people.mjs).
 *
 * @module directory
 */
const { FP, canon, checkBundle, fingerprint, statementId, signStatement, verifyStatement } = __keys

const REGISTRY = 'pki.sgit.ai'
const TYPES = ['identity', 'evidence', 'link', 'inbox', 'revocation']
const BOUNDS = { statement_bytes: 16384, statements: 256, links: 150, agents: 200, evidence: 32 }
const EVIDENCE = {
    website: { label: 'A website', machine: true, how: 'a file at https://<your domain>/.well-known/pki.sgit.ai.txt containing the proof line' },
    github: { label: 'GitHub', machine: true, how: 'a public gist, owned by your account, containing the proof line' },
    dns: { label: 'A DNS record', machine: true, how: 'a TXT record at _pki.sgit.ai.<your domain> containing the proof line' },
    key: { label: 'A key you publish elsewhere', machine: false, how: 'a URL where you already publish a key (github.com/<you>.keys, keys.openpgp.org, your site)' },
    link: { label: 'A profile', machine: false, how: 'LinkedIn or another profile: a link a person checks, not a machine' },
}
/** The verification methods an anchor may name. Published by name; the details stay in the anchor's vault. */
const METHODS = { 'delegates': 'vouches for this key, for the uses it names (a sign-in elsewhere)', 'in-person': 'met in person', 'video-call': 'on a video call', 'known-channel': 'on a channel already known to be theirs', 'invitation': 'through an invitation they accepted', 'known': 'known to me',
                          'operates': 'runs this agent', 'operated-by': 'is the agent of this key',
                          'persona': 'is another key of mine (a persona)', 'persona-of': 'is a persona of this key' }
const AGENT_DAYS = 30
const VERIFYING = ['in-person', 'video-call', 'known-channel']
const VERIFY_DAYS = 365
const today = () => new Date().toISOString().slice(0, 10)
const plusDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10)
/** When a verifying link stops verifying: its own `until`, or VERIFY_DAYS after it was made. */
const validUntil = l => l.until || plusDays(l.on || String(l.at).slice(0, 10), l.method === 'operates' ? AGENT_DAYS : VERIFY_DAYS)

/** The proof line evidence carries: the record's fingerprint, so a page, a gist or a TXT record names this key. */
const proofLine = fp => `pki.sgit.ai=${fp}`
const hasProof = (text, fp) => String(text || '').includes(proofLine(fp))

const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x)

// ------------------------------------------------------------ writing statements (the owner, in their browser)
/** One statement, signed with the owner's key. identity = { bundle, private: { sign } }. */
async function statement(identity, type, body, at = now()) {
    if (!TYPES.includes(type)) throw new Error(`unknown statement type ${type}`)
    const fp = identity.bundle.signing_fingerprint
    const st = await signStatement({ v: 1, type, registry: REGISTRY, record: fp, signer: fp, created_at: at, body }, identity.private.sign)
    if (new TextEncoder().encode(canon(st) + '\n').length > BOUNDS.statement_bytes) throw new Error('over the 16 KiB bound for one statement')
    return st
}
const identityStatement = (identity, { name, about = '' }, at) =>
    statement(identity, 'identity', { kind: 'person', name: String(name).trim(), about: String(about || '').trim(), bundle: identity.bundle, private_key_published: false }, at)
/** An agent's identity: runtime says where it runs (free text), session that the key lives only as long as one session. */
const agentStatement = (identity, { name, about = '', runtime = '', session = false }, at) =>
    statement(identity, 'identity', { kind: 'agent', name: String(name).trim(), about: String(about || '').trim(), runtime: String(runtime || '').trim(), session: !!session, bundle: identity.bundle, private_key_published: false }, at)
const evidenceStatement = (identity, { kind, value, url = '' }, at) => statement(identity, 'evidence', { kind, value: String(value).trim(), url: String(url || '').trim() }, at)
const POLICY = /^sha256:[0-9a-f]{64}$/
function linkStatement(identity, { to, method = '', on = '', until = '', policy = '', delegation = '', can = null }, at) {
    const body = { to, method, on }
    if (until) body.until = until
    if (policy) body.policy = policy
    if (delegation) body.delegation = delegation           // a "delegates" link: the delegation it vouches for, by hash
    if (can) body.can = can
    return statement(identity, 'link', body, at)
}
const inboxStatement = (identity, { endpoint, vault, token }, at) => statement(identity, 'inbox', { endpoint, vault, token }, at)
async function withdrawStatement(identity, of, reason = 'withdrawn', at = now()) {
    return statement(identity, 'revocation', { revokes: { record: identity.bundle.signing_fingerprint, statement: typeof of === 'string' ? of : await statementId(of) }, reason, effective_from: at }, at)
}

// ------------------------------------------------------------ reading one record (anyone, anywhere)
/**
 * Check one record: every rule a statement must keep. Returns
 *   { fp, ok, problems, identity, name, bundle, statements: [{ st, id, live }], evidence, links, inbox, revoked, fixture }
 * where evidence, links and inbox are the LIVE ones (not withdrawn). `dir` is the folder's fingerprint, when known.
 */
async function readRecord(statements, { dir = null, fixture = false } = {}) {
    const problems = [], out = { fp: dir, ok: false, problems, identity: null, name: '', bundle: null, statements: [], evidence: [], links: [], inbox: null, revoked: null, fixture: !!fixture }
    if (!Array.isArray(statements) || !statements.length) { problems.push('no statements'); return out }
    if (statements.length > BOUNDS.statements) problems.push(`${statements.length} statements: over the bound of ${BOUNDS.statements} (rule 3)`)
    const sorted = [...statements].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    const ids = sorted.filter(s => isObj(s) && s.type === 'identity')
    if (ids.length !== 1) { problems.push(ids.length ? 'more than one identity statement' : 'no identity statement: a record starts from the key'); return out }
    const idSt = ids[0], bundle = isObj(idSt.body) ? idSt.body.bundle : null
    const bp = await checkBundle(bundle)
    if (bp.length) { problems.push(...bp.map(p => 'identity: ' + p)); return out }
    const fp = bundle.signing_fingerprint
    if (dir && dir !== fp) problems.push(`the folder is ${dir} but the key is ${fp}`)
    out.fp = fp; out.bundle = bundle; out.identity = idSt; out.name = String(idSt.body.name || '')
    if (sorted[0] !== idSt) problems.push('a statement predates the identity')
    const byId = new Map()
    for (const st of sorted) {
        const where = `${st && st.type || '?'} ${st && st.created_at || ''}`.trim()
        if (!isObj(st) || st.v !== 1 || st.registry !== REGISTRY || !TYPES.includes(st.type) || !isObj(st.body) || !/^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(String(st.created_at))) { problems.push(`${where}: not a register statement`); continue }
        if (st.record !== fp || st.signer !== fp) { problems.push(`${where}: written for ${st.record} by ${st.signer}, in the record of ${fp}: only the owner writes to their own record (rule 1)`); continue }
        try { if (new TextEncoder().encode(canon(st) + '\n').length > BOUNDS.statement_bytes) { problems.push(`${where}: over 16 KiB (rule 3)`); continue } }
        catch (e) { problems.push(`${where}: ${e.message}`); continue }
        if (!await verifyStatement(st, bundle.sign)) { problems.push(`${where}: the signature does not verify (rule 4)`); continue }
        const id = await statementId(st)
        const entry = { st, id, live: true }
        byId.set(id, entry); out.statements.push(entry)
        const p = shapeProblems(st, fp)
        if (p) { problems.push(`${where}: ${p}`); entry.live = false }
    }
    for (const e of out.statements) {                                       // withdrawals: of the owner's own statements only
        if (e.st.type !== 'revocation' || !e.live) continue
        const target = byId.get(e.st.body.revokes.statement)
        if (!target) { problems.push(`revocation ${e.st.created_at}: names a statement not in this record`); continue }
        if (target.st.type === 'identity') out.revoked = { at: e.st.body.effective_from || e.st.created_at, reason: e.st.body.reason || '' }
        target.live = false
    }
    const live = t => out.statements.filter(e => e.live && e.st.type === t)
    out.evidence = live('evidence').map(e => ({ id: e.id, at: e.st.created_at, ...e.st.body }))
    const lastLink = new Map()                                             // the latest live link to each key
    for (const e of live('link')) lastLink.set(e.st.body.to, { id: e.id, at: e.st.created_at, ...e.st.body })
    out.links = [...lastLink.values()]
    const inb = live('inbox'); out.inbox = inb.length ? { id: inb[inb.length - 1].id, ...inb[inb.length - 1].st.body } : null
    const toAgents = out.links.filter(l => l.method === 'operates' || l.method === 'delegates').length
    if (out.links.length - toAgents > BOUNDS.links) problems.push(`${out.links.length - toAgents} live links: over the bound of ${BOUNDS.links} (rule 3)`)
    if (toAgents > BOUNDS.agents) problems.push(`${toAgents} operated agents: over the bound of ${BOUNDS.agents} (rule 3); use a fleet key`)
    out.kind = idSt.body.kind
    if (out.evidence.length > BOUNDS.evidence) problems.push(`${out.evidence.length} live evidence items: over the bound of ${BOUNDS.evidence} (rule 3)`)
    if (out.revoked) { out.links = []; out.inbox = null }
    out.ok = problems.length === 0
    return out
}
function shapeProblems(st, fp) {
    const b = st.body
    switch (st.type) {
        case 'identity':
            if (b.kind !== 'person' && b.kind !== 'agent') return 'identity kind must be person or agent'
            if (!String(b.name || '').trim()) return 'an identity names who or what it is'
            if (b.kind === 'agent' && (String(b.runtime || '').length > 120 || (b.session != null && typeof b.session !== 'boolean'))) return 'runtime is short text and session a boolean'
            if (String(b.name || '').length > 120 || String(b.about || '').length > 600) return 'the name or about is too long'
            if (b.private_key_published !== false && b.private_key_published !== true) return 'private_key_published must be stated'
            return null
        case 'evidence':
            if (!EVIDENCE[b.kind]) return `unknown evidence kind ${b.kind}`
            if (!String(b.value || '').trim() || String(b.value).length > 300 || String(b.url || '').length > 500) return 'evidence names what it is about, briefly'
            if (b.url && !/^https:\/\//.test(b.url)) return 'an evidence URL is https'
            return null
        case 'link':
            if (!FP.test(String(b.to))) return 'a link names a key fingerprint'
            if (b.to === fp) return 'a link to oneself'
            if (b.method && !METHODS[b.method]) return `unknown method ${b.method}`
            if (b.on && !/^\d{4}-\d\d-\d\d$/.test(b.on)) return 'on is a date, yyyy-mm-dd'
            if (b.until && (!/^\d{4}-\d\d-\d\d$/.test(b.until) || (b.on && b.until < b.on))) return 'until is a date, yyyy-mm-dd, not before on'
            if (b.policy != null && !POLICY.test(String(b.policy))) return 'a policy is named by its sha256:<64 hex>'
            if (b.method === 'delegates' && (!POLICY.test(String(b.delegation)) || !b.until || !Array.isArray(b.can) || !b.can.length || b.can.length > 8 || !b.can.every(c => /^(identity|delegate|sign(:[a-z0-9-]{1,32})?)$/.test(String(c)))))
                return 'a delegates link names its delegation (sha256:<64 hex>), an until date and the uses it allows'
            if (b.method !== 'delegates' && (b.delegation != null || b.can != null)) return 'only a delegates link names a delegation'
            return null
        case 'inbox':
            if (!/^https:\/\/[a-z0-9.-]+$/.test(String(b.endpoint)) || !/^[a-z0-9]{4,24}$/.test(String(b.vault)) || !/^[0-9a-f]{16,128}$/.test(String(b.token))) return 'an inbox is an https endpoint, a vault id and a hex append token'
            return null
        case 'revocation':
            if (!isObj(b.revokes) || b.revokes.record !== fp || !/^sha256:[0-9a-f]{64}$/.test(String(b.revokes.statement))) return 'a revocation withdraws a statement of this record, by id'
            return null
    }
    return 'unknown type'
}

// ------------------------------------------------------------ the register: everybody's records, read together
/**
 * The graph from read records: { people: Map(fp → record), edges: [[a, b, {ab, ba}]], claims: [{from, to, link}],
 *   degrees: Map(fp → n) from the anchors, via: Map(fp → fp) (one shortest path's previous hop),
 *   verified: Map(fp → { by, method, on, at, until }), expired: Map(fp → the same, for verifications past their end) }.
 * asOf (yyyy-mm-dd, default today) is the day verifications are judged on.
 * Only records that read cleanly, are not revoked, and (unless includeFixtures) are not fixtures take part.
 */
function graph(records, { anchors = [], includeFixtures = false, asOf = today() } = {}) {
    const people = new Map()
    for (const r of records) if (r.ok && !r.revoked && (includeFixtures || !r.fixture)) people.set(r.fp, r)
    const linkOf = (a, b) => (people.get(a) && people.get(a).links.find(l => l.to === b)) || null
    const edges = [], claims = [], adj = new Map([...people.keys()].map(k => [k, new Set()]))
    for (const [a, r] of people) for (const l of r.links) {
        if (!people.has(l.to)) { claims.push({ from: a, to: l.to, link: l, reason: 'not in the register' }); continue }
        const back = linkOf(l.to, a)
        if (!back) { claims.push({ from: a, to: l.to, link: l, reason: 'not confirmed' }); continue }
        adj.get(a).add(l.to)
        if (a < l.to) edges.push([a, l.to, { ab: l, ba: back }])
    }
    const live = anchors.filter(a => people.has(a))
    const degrees = new Map(), via = new Map(), queue = []
    for (const a of live) { degrees.set(a, 0); queue.push(a) }
    while (queue.length) {
        const x = queue.shift()
        for (const y of adj.get(x)) if (!degrees.has(y)) { degrees.set(y, degrees.get(x) + 1); via.set(y, x); queue.push(y) }
    }
    const verified = new Map(), expired = new Map()
    for (const a of live) for (const y of adj.get(a)) {
        const l = linkOf(a, y)
        if (!l || !VERIFYING.includes(l.method)) continue
        const v = { by: a, method: l.method, on: l.on || l.at.slice(0, 10), at: l.at, until: validUntil(l) }
        if (v.until >= asOf) { const prev = verified.get(y); if (!prev || prev.until < v.until) verified.set(y, v) }
        else if (!expired.has(y) || expired.get(y).until < v.until) expired.set(y, v)
    }
    for (const y of verified.keys()) expired.delete(y)
    // agents: operated when the operator's link names "operates" and is in date, and the agent links back
    const operated = new Map(), lapsed = new Map()
    for (const [a, r] of people) for (const l of r.links) {
        const ag = people.get(l.to)
        if (l.method !== 'operates' || !ag || ag.kind !== 'agent' || !adj.get(a).has(l.to)) continue
        const back = linkOf(l.to, a)
        const v = { by: a, on: l.on || l.at.slice(0, 10), at: l.at, until: validUntil(l), policy: l.policy || '', claimed_policy: (back && back.policy) || '' }
        if (v.until >= asOf) { if (!operated.has(l.to) || operated.get(l.to).until < v.until) operated.set(l.to, v) }
        else if (!lapsed.has(l.to) || lapsed.get(l.to).until < v.until) lapsed.set(l.to, v)
    }
    for (const y of operated.keys()) lapsed.delete(y)
    // personas: the master links with "persona", the persona links back with "persona-of"; both people, both live
    const personas = new Map()
    for (const [a, r] of people) for (const l of r.links) {
        const p = people.get(l.to), back = linkOf(l.to, a)
        if (l.method !== 'persona' || !p || p.kind !== 'person' || r.kind !== 'person' || !back || back.method !== 'persona-of') continue
        personas.set(l.to, { of: a, on: l.on || l.at.slice(0, 10), at: l.at })
    }
    return { people, edges, claims, adj, degrees, via, verified, expired, operated, lapsed, personas, anchors: live, asOf }
}
/** The steps between two people, through confirmed links only: [a, …, b], or null. */
function path(g, a, b) {
    if (!g.adj.has(a) || !g.adj.has(b)) return null
    const prev = new Map([[a, null]]), q = [a]
    while (q.length) {
        const x = q.shift()
        if (x === b) break
        for (const y of g.adj.get(x)) if (!prev.has(y)) { prev.set(y, x); q.push(y) }
    }
    if (!prev.has(b)) return null
    const out = []; for (let x = b; x != null; x = prev.get(x)) out.unshift(x)
    return out
}
/** The operators above an agent, nearest first, up to three steps: [fp, …]; the last is the root. */
function operators(g, fp) {
    const out = []
    for (let x = fp, i = 0; i < 3 && g.operated.has(x); i++) { x = g.operated.get(x).by; if (out.includes(x)) break; out.push(x) }
    return out
}
/** What the register says about one person (or agent), in words the page shows. */
function standing(g, fp) {
    const rec = g.people.get(fp)
    if (rec && rec.kind === 'agent') {
        const op = g.operated.get(fp)
        if (op) {
            const chain = operators(g, fp), root = chain[chain.length - 1], rs = standing(g, root)
            const trusted = g.people.get(root) && g.people.get(root).kind === 'person' && ['anchor', 'verified'].includes(rs.level)
            return { level: trusted ? 'operated' : 'agent', text: `an agent operated by ${chain.map(x => nameOf(g, x)).join(', operated by ')}; confirmed ${op.on}, valid until ${op.until}${trusted ? '' : ` (whose own standing: ${rs.level})`}`, ...op, chain, root, trusted }
        }
        const x = g.lapsed.get(fp)
        if (x) return { level: 'expired', text: `an agent operated by ${nameOf(g, x.by)} until ${x.until}: to be confirmed again`, ...x }
        // say which side is missing: an agent that names no operator, or one whose operator has published no link back
        const named = (rec.links || []).filter(l => l.method === 'operated-by').map(l => l.to)
        if (!named.length) return { level: 'listed', text: 'an agent in the register, not confirmed by an operator: it names no operator (node pki-agent.mjs operator <fp>, then its submission)' }
        return { level: 'listed', text: `an agent in the register, not confirmed by an operator: it names ${named.map(x => nameOf(g, x)).join(', ')} as its operator, and the register holds no "operates" link back (if one was signed, it is not published yet)`, named }
    }
    if (g.anchors.includes(fp)) return { level: 'anchor', text: 'an anchor: verification starts here' }
    const v = g.verified.get(fp)
    if (v) return { level: 'verified', text: `verified by ${nameOf(g, v.by)}, ${METHODS[v.method]}, on ${v.on}; valid until ${v.until}`, ...v }
    const pa = g.personas && g.personas.get(fp)
    if (pa && !(g.personas.has(pa.of))) {                                  // one level: a persona of a persona is not followed
        const ms = standing(g, pa.of)
        return { level: 'persona', text: `a persona of ${nameOf(g, pa.of)}, who holds both keys (their standing: ${ms.text})`, ...pa, master: pa.of, masterLevel: ms.level, trusted: ['anchor', 'verified'].includes(ms.level) }
    }
    const x = g.expired && g.expired.get(fp)
    if (x) return { level: 'expired', text: `verified by ${nameOf(g, x.by)} on ${x.on}; expired on ${x.until}: to be verified again`, ...x, degree: g.degrees.get(fp) }
    if (g.degrees.has(fp)) return { level: 'linked', text: `${g.degrees.get(fp)} step${g.degrees.get(fp) === 1 ? '' : 's'} from an anchor, through confirmed links`, degree: g.degrees.get(fp) }
    if (g.people.has(fp)) return { level: 'listed', text: 'in the register, not yet linked to an anchor' }
    return { level: 'absent', text: 'not in the register' }
}
/**
 * Whether `fp` is trusted from a pinned root, for sealing a secret to it. g must be built with anchors: [root] and
 * nothing else. Returns { ok, why, chain (fp … root), until?, policy?, claimed_policy?, policy_agrees? }.
 */
function trustFrom(g, fp, root) {
    if (!FP.test(String(root || ''))) return { ok: false, why: 'no root pinned' }
    if (!g.people.has(root)) return { ok: false, why: `the pinned root ${root} is not in the register (or its record does not read, or is revoked)` }
    if (g.anchors.length !== 1 || g.anchors[0] !== root) return { ok: false, why: 'the graph was not built from the pinned root alone' }
    if (fp === root) return { ok: true, why: 'the pinned root itself', chain: [root] }
    const rec = g.people.get(fp)
    if (!rec) return { ok: false, why: `${fp} is not in the register (or its record does not read, or is revoked)` }
    const s = standing(g, fp)
    const viaRoot = person => person === root || (g.verified.has(person) && g.verified.get(person).by === root)
    if (rec.kind === 'agent') {
        if (s.level !== 'operated' && s.level !== 'agent') return { ok: false, why: s.text }
        const top = s.root
        if (!g.people.get(top) || g.people.get(top).kind !== 'person' || !viaRoot(top)) return { ok: false, why: `${s.text}; the person at the top of the chain is neither the root nor verified by it` }
        const op = g.operated.get(fp)
        return { ok: true, why: s.text, chain: [fp, ...s.chain, ...(top === root ? [] : [root])], until: op.until, policy: op.policy, claimed_policy: op.claimed_policy, policy_agrees: !op.policy || !op.claimed_policy || op.policy === op.claimed_policy }
    }
    if (s.level === 'verified' && s.by === root) return { ok: true, why: s.text, chain: [fp, root], until: s.until }
    if (s.level === 'persona' && viaRoot(s.master)) return { ok: true, why: s.text, chain: [fp, s.master, ...(s.master === root ? [] : [root])] }
    return { ok: false, why: `${s.text}: not verified by the pinned root` }
}
const nameOf = (g, fp) => (g.people.get(fp) && g.people.get(fp).name) || fp
/** One-way links pointing at someone: the claims they can confirm by linking back. */
const waitingFor = (g, fp) => g.claims.filter(c => c.to === fp && c.reason === 'not confirmed')
/** The number to watch: real keys in the register (fixtures excluded, revoked excluded). */
const realKeys = records => records.filter(r => r.ok && !r.fixture && !r.revoked && r.identity && r.identity.body.kind === 'person').length
/** Agents' keys, counted apart: they are many, cheap, and short-lived. */
const realAgents = records => records.filter(r => r.ok && !r.fixture && !r.revoked && r.identity && r.identity.body.kind === 'agent').length

/** A submission: the statements a person hands to the register, in one file. */
const SUBMISSION = 'pki.sgit.ai/submission/v1'
function submission(statements) { return { kind: SUBMISSION, record: statements[0] && statements[0].record, statements } }
/** Several submissions in one file (an operator's link and the agent's record, say), for one `people.mjs add`. */
const SUBMISSIONS = 'pki.sgit.ai/submissions/v1'
const submissions = subs => ({ kind: SUBMISSIONS, submissions: subs })

return { REGISTRY, TYPES, BOUNDS, EVIDENCE, METHODS, AGENT_DAYS, VERIFYING, VERIFY_DAYS, validUntil, proofLine, hasProof, statement, identityStatement, agentStatement, evidenceStatement, POLICY, linkStatement, inboxStatement, withdrawStatement, readRecord, graph, path, operators, standing, trustFrom, nameOf, waitingFor, realKeys, realAgents, SUBMISSION, submission, SUBMISSIONS, submissions, fingerprint, statementId }
})()

// ---------------------------------------------------------------- assets/people/message.js
const __message = (() => {
/**
 * message.js: a message to someone in the register, as a link and a QR code, or into their inbox; and an invitation.
 *
 * A message is JSON, signed by the sender when the sender has a key, then sealed in sgit's hybrid v2 envelope to the
 * recipient's encryption key:
 *
 *     inner   { v: 1, kind: "pki.sgit.ai/message/v1", to, from?, at, expires?, subject?, text, files?: [{ name, type, data (base64) }],
 *               grant?: { service: "sg-send", endpoint, token, name? }, sig? }
 *             expires: an ISO time after which the recipient should refuse it, inside the signature, so an old QR
 *             code shown again (a replay) reads as expired; with `to` and `at` signed too, it cannot be re-addressed.
 *             grant: an access key handed over, sealed to the person it is for (the key-management proposal's phase 0).
 *             sig: the sender's ECDSA over the canonical bytes (keys.js canon, without sig). It covers `to`, so a
 *             recipient cannot re-seal a signed message to a third party and have it read as addressed to them,
 *             which the envelope's own s (over c only, see sgit.ai/docs/pki.md) does not prevent.
 *     outer   sgit's .enc text, with s and f too when signed, so `sgit pki decrypt` opens it and checks it.
 *
 * As a link (the QR code is the same text), the envelope's binary fields travel as base64url, not base64-in-JSON-in-
 * base64, which keeps a short message inside one QR code:
 *
 *     https://pki.sgit.ai/m/#m1.<recipient fp, 16 hex>.<w>.<i>.<c>[.<s>.<sender signing fp, 16 hex>]
 *
 * Everything after # stays in the browser: a fragment is never sent to a server. The page that opens it rebuilds the
 * .enc text, unlocks the reader's vault, and decrypts there.
 *
 * A public key is a link too (k1), to show as a QR code or send, so someone can seal a message (an access key, say) to
 * a person who is not in the register yet. It carries the two keys' SPKI bytes and the label; the bundle and both
 * fingerprints are recomputed from them. It is not secret, and not authenticated: the camera, face to face, or a
 * fingerprint compared on a channel already known, is what says whose key it is.
 *
 *     https://pki.sgit.ai/send/#k1.<encryption SPKI>.<signing SPKI>.<label, utf-8>          (base64url, each)
 *
 * An invitation is a link too, signed by the inviter, naming nobody (the invitee has no key yet):
 *
 *     https://pki.sgit.ai/join/#i1.<inviter signing fp, 16 hex>.<expires yyyymmdd>.<nonce, 16 hex>.<sig>[&n=<name>][&k=<access key>]
 *
 * The invitee makes a key and their record's first link points at the inviter; the inviter's side shows it waiting
 * and confirms it with one link back. n (a name the inviter wrote, a hint only) and k (an SG/Send access key, so the
 * invitee can create vaults) are outside the signature and are only ever what the inviter typed.
 *
 * @module message
 */
const { b64, unb64, b64url, unb64url, canon, utf8, fromUtf8, unpem, bundleOf, signBytes, verifyBytes, seal, unseal, parseEnvelope, hex, unhex } = __keys

const KIND = 'pki.sgit.ai/message/v1'
const SITE = 'https://pki.sgit.ai/'
const short = fp => String(fp).replace(/^sha256:/, '')
const long = s => 'sha256:' + s
const MAX_QR_CHARS = 2300                            // version 40 at level L holds 2953 bytes; leave room for the URL

// ------------------------------------------------------------ the inner message
/** The inner message, signed when `from` is an identity ({ bundle, private: { sign } }). */
async function compose({ to, from = null, subject = '', text = '', files = [], grant = null, at = new Date().toISOString(), expires = '' }) {
    const msg = { v: 1, kind: KIND, to: to.signing_fingerprint, at, text: String(text) }
    if (expires) msg.expires = String(expires)
    if (subject) msg.subject = String(subject)
    if (grant) msg.grant = { service: 'sg-send', endpoint: String(grant.endpoint || 'https://dev.send.sgraph.ai'), token: String(grant.token), ...(grant.name ? { name: String(grant.name) } : {}) }
    if (files.length) msg.files = files.map(f => ({ name: String(f.name), type: String(f.type || 'application/octet-stream'), data: typeof f.data === 'string' ? f.data : b64(f.data) }))
    if (from) {
        msg.from = from.bundle.signing_fingerprint
        msg.sig = b64(await signBytes(from.private.sign, utf8(canon(msg) + '\n')))
    }
    return msg
}
/** Check a message's own signature against a bundle; null when there is no bundle to check it with. */
async function verifyMessage(msg, fromBundle) {
    if (!msg || !msg.sig || !msg.from) return null
    if (!fromBundle || fromBundle.signing_fingerprint !== msg.from) return null
    const { sig, ...rest } = msg
    return verifyBytes(fromBundle.sign, unb64(sig), utf8(canon(rest) + '\n'))
}
function problems(msg, myFps = []) {
    const out = []
    if (!msg || msg.kind !== KIND || msg.v !== 1) return ['not a pki.sgit.ai message']
    if (myFps.length && !myFps.includes(msg.to)) out.push('addressed to another key')
    if (typeof msg.text !== 'string') out.push('no text')
    if (msg.expires && String(msg.expires) < new Date().toISOString()) out.push(`expired at ${msg.expires}: refuse it, it may be a replay`)
    return out
}

// ------------------------------------------------------------ sealing, and the link
/** Seal a composed message to the recipient's bundle. Returns { enc, code, url } (code: the m1 text). */
async function sealMessage(msg, toBundle, from = null) {
    const signer = from ? { sign: from.private.sign, fingerprint: from.bundle.signing_fingerprint } : null
    const enc = await seal(toBundle, JSON.stringify(msg), signer)
    const code = codeOf(enc, toBundle.signing_fingerprint)
    return { enc, code, url: SITE + 'm/#' + code }
}
/** The m1 text from an .enc envelope. */
function codeOf(enc, toFp) {
    const env = parseEnvelope(enc), parts = ['m1', short(toFp), b64url(unb64(env.w)), b64url(unb64(env.i)), b64url(unb64(env.c))]
    if (env.s && env.f) parts.push(b64url(unb64(env.s)), short(env.f))
    return parts.join('.')
}
/** Back from the m1 text (or a URL holding one) to { to, enc }; null when there is none. */
function parseCode(text) {
    const m = /m1\.([0-9a-f]{16})\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)(?:\.([A-Za-z0-9_-]{80,90})\.([0-9a-f]{16}))?/.exec(String(text || ''))
    if (!m) return null
    try {
        const env = { v: 2, w: b64(unb64url(m[2])), i: b64(unb64url(m[3])), c: b64(unb64url(m[4])) }
        if (m[5]) { env.s = b64(unb64url(m[5])); env.f = long(m[6]) }
        return { to: long(m[1]), enc: btoa(JSON.stringify(env)), signer: m[6] ? long(m[6]) : null, code: m[0] }
    } catch (e) { return null }
}
/**
 * Open a message with one of the reader's identities. Returns { msg, identity, envelope: { signed, signer, verified },
 * verified (the inner signature: true, false or null), problems }. bundlesByFp: Map or object of known bundles.
 */
async function openMessage(enc, identities, known = new Map()) {
    const look = fp => (known instanceof Map ? known.get(fp) : known[fp]) || null
    let lastErr = null
    for (const id of identities) {
        let opened
        try { opened = await unseal(id.private.encrypt, enc, [look(parseEnvelope(enc).f)].filter(Boolean)) }
        catch (e) { lastErr = e; if (/changed on the way/.test(e.message)) throw e; continue }
        let msg = null
        try { msg = JSON.parse(opened.text) } catch (e) { /* not ours: plain text sealed with sgit pki encrypt */ }
        if (!msg || msg.kind !== KIND) return { msg: { v: 1, kind: KIND, to: id.bundle.signing_fingerprint, text: opened.text == null ? '' : opened.text, raw: true }, identity: id, envelope: opened, verified: null, problems: ['sealed with sgit pki encrypt, not this site: shown as it is'] }
        return { msg, identity: id, envelope: opened, verified: await verifyMessage(msg, look(msg.from)), problems: problems(msg, [id.bundle.signing_fingerprint]) }
    }
    throw lastErr || new Error('no key to open it with')
}

// ------------------------------------------------------------ invitations
const INVITE = 'pki.sgit.ai/invite/v1'
const inviteBytes = (fp, exp, nonce) => utf8(`${INVITE}|${fp}|${exp}|${nonce}`)
/** An invitation from an identity, valid until `days` from now. Returns { code, url }. */
async function invite(from, { days = 30, name = '', accessKey = '' } = {}) {
    const fp = from.bundle.signing_fingerprint
    const exp = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10).replace(/-/g, '')
    const nonce = hex(globalThis.crypto.getRandomValues(new Uint8Array(8)))
    const sig = b64url(await signBytes(from.private.sign, inviteBytes(fp, exp, nonce)))
    let code = ['i1', short(fp), exp, nonce, sig].join('.')
    const extra = []
    if (name) extra.push('n=' + encodeURIComponent(name))
    if (accessKey) extra.push('k=' + encodeURIComponent(accessKey))
    if (extra.length) code += '&' + extra.join('&')
    return { code, url: SITE + 'join/#' + code }
}
/** Read an invitation: { from, expires, nonce, name, accessKey, expired, verify(bundle) }; null when there is none. */
function parseInvite(text) {
    const s = String(text || ''), m = /i1\.([0-9a-f]{16})\.(\d{8})\.([0-9a-f]{16})\.([A-Za-z0-9_-]{80,90})/.exec(s)
    if (!m) return null
    const q = new URLSearchParams((s.split(m[0])[1] || '').replace(/^&/, ''))
    const from = long(m[1]), expires = `${m[2].slice(0, 4)}-${m[2].slice(4, 6)}-${m[2].slice(6)}`
    return { from, expires, nonce: m[3], name: q.get('n') || '', accessKey: q.get('k') || '', expired: expires < new Date().toISOString().slice(0, 10),
             verify: bundle => bundle && bundle.signing_fingerprint === from ? verifyBytes(bundle.sign, unb64url(m[4]), inviteBytes(from, m[2], m[3])) : Promise.resolve(null) }
}
/** A public bundle as a k1 code and a link to the send page with it. */
function keyCode(bundle) {
    const code = `k1.${b64url(unpem(bundle.encrypt).der)}.${b64url(unpem(bundle.sign).der)}.${b64url(utf8(bundle.label || ''))}`
    return { code, url: SITE + 'send/#' + code }
}
/** Read a k1 code (in a link or alone): the bundle, recomputed; null when there is none. */
async function parseKeyCode(text) {
    const m = /k1\.([A-Za-z0-9_-]{100,1200})\.([A-Za-z0-9_-]{60,200})\.([A-Za-z0-9_-]{0,200})/.exec(String(text || ''))
    if (!m) return null
    return bundleOf(unb64url(m[1]), unb64url(m[2]), fromUtf8(unb64url(m[3])))
}
// ------------------------------------------------------------ QR codes for agents: strict JSON, two kinds
/**
 * What a QR code carries when an agent is to read it: one JSON object, of one of two kinds, with exactly these keys.
 * An agent reading a QR code reads data someone else made, carried by hand: so the text is parsed, never interpreted,
 * and anything outside the shape below is refused before a byte of it is used.
 *
 *   { "v": 1, "kind": "pki.sgit.ai/qr/sealed/v1", "to": "sha256:<16 hex>", "from": "sha256:<16 hex>", "code": "m1.…" }
 *   { "v": 1, "kind": "pki.sgit.ai/qr/key/v1", "fp": "sha256:<16 hex>", "label": "<80 printable characters>", "code": "k1.…" }
 *
 * "to" and "from" repeat what the sealed code says (the recipient's fingerprint and the signer's), and must agree with
 * it; the code is what is opened, and its signature is what is trusted. A pki.sgit.ai link (/m/#m1.…, /send/#k1.…) is
 * read too, and turned into the same object, for a QR code made for a phone.
 */
const QR_SEALED = 'pki.sgit.ai/qr/sealed/v1', QR_KEY = 'pki.sgit.ai/qr/key/v1'
const FPX = /^sha256:[0-9a-f]{16}$/, M1X = /^m1\.[0-9a-f]{16}(\.[A-Za-z0-9_-]+){3}(\.[A-Za-z0-9_-]+\.[0-9a-f]{16})?$/, K1X = /^k1\.[A-Za-z0-9_-]{100,1200}\.[A-Za-z0-9_-]{60,200}\.[A-Za-z0-9_-]{0,200}$/
function qrSealed({ to, from = '', code }) { const o = { v: 1, kind: QR_SEALED, to }; if (from) o.from = from; o.code = code; return JSON.stringify(o) }
function qrKey({ fp, label = '', code }) { return JSON.stringify({ v: 1, kind: QR_KEY, fp, label: String(label).slice(0, 80), code }) }
function parseQrText(text) {
    const s = String(text == null ? '' : text).trim()
    if (s.length > 3000) throw new Error('longer than any QR code this site makes: refused')
    if (s.startsWith('{')) {
        let o; try { o = JSON.parse(s) } catch (e) { throw new Error('not JSON: refused') }
        if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('not a JSON object: refused')
        const keys = Object.keys(o).sort().join(','), allowed = o.kind === QR_SEALED ? ['code', 'from', 'kind', 'to', 'v'] : o.kind === QR_KEY ? ['code', 'fp', 'kind', 'label', 'v'] : null
        if (!allowed) throw new Error('an unknown kind of QR code: refused')
        if (o.v !== 1) throw new Error('an unknown version: refused')
        if (keys.split(',').some(k => !allowed.includes(k))) throw new Error(`unexpected fields (${keys}): refused`)
        for (const k of Object.keys(o)) if (k !== 'v' && typeof o[k] !== 'string') throw new Error(`${k} is not a string: refused`)
        if (o.kind === QR_SEALED) {
            if (!FPX.test(o.to || '') || (o.from != null && !FPX.test(o.from)) || !M1X.test(o.code || '')) throw new Error('a field is not in its shape: refused')
            const c = parseCode(o.code)
            if (!c || c.to !== o.to || (o.from && c.signer !== o.from)) throw new Error('to or from does not match the sealed code: refused')
            return { kind: 'sealed', to: o.to, from: o.from || c.signer || '', code: o.code }
        }
        if (!FPX.test(o.fp || '') || !K1X.test(o.code || '') || /[\u0000-\u001f\u007f]/.test(o.label || '') || String(o.label || '').length > 80) throw new Error('a field is not in its shape: refused')
        return { kind: 'key', fp: o.fp, label: o.label || '', code: o.code }
    }
    const m = /^https:\/\/pki\.sgit\.ai\/(m|send)\/(?:index\.html)?#((?:m1|k1)\.[A-Za-z0-9_.-]+)$/.exec(s) || /^((m1|k1)\.[A-Za-z0-9_.-]+)$/.exec(s) && [null, null, s]
    if (!m) throw new Error('neither a pki.sgit.ai QR object nor a pki.sgit.ai link: refused')
    const code = m[2]
    if (code.startsWith('m1.')) { if (!M1X.test(code)) throw new Error('a sealed code not in its shape: refused'); const c = parseCode(code); return { kind: 'sealed', to: c.to, from: c.signer || '', code } }
    if (!K1X.test(code)) throw new Error('a key code not in its shape: refused')
    return { kind: 'key', fp: '', label: '', code }
}
// ------------------------------------------------------------ vault keys in text: found, so they travel as files
/** A vault key in text, prefixed or as passphrase:vault-id alone. The prefix is split so this file holds no key-shaped literal. */
const VAULT_KEY_RE = new RegExp('(?:sgit_private_' + 'vault_)?\\b([a-z0-9]{16,64}):([a-z0-9]{6,32})\\b', 'g')
const PREFIXED = (pass, id) => 'sgit_private_' + 'vault_' + pass + ':' + id
/** Every vault key in a text: [{ id, key (prefixed, the form sgit takes) }], and the text with each one replaced by a
    placeholder naming only its vault id. */
function vaultKeysIn(text) {
    const keys = [], seen = new Set()
    const redacted = String(text || '').replace(VAULT_KEY_RE, (_, pass, id) => { if (!seen.has(id)) { seen.add(id); keys.push({ id, key: PREFIXED(pass, id) }) } return `‹the vault key of ${id}: sent as a file, not shown›` })
    return { keys, text: redacted }
}
/** The file a vault key travels in. */
const vaultKeyFile = k => ({ name: `vault-key-${k.id}.txt`, type: 'text/plain', data: b64(utf8(k.key + '\n')) })

return { KIND, SITE, MAX_QR_CHARS, compose, verifyMessage, problems, sealMessage, codeOf, parseCode, openMessage, invite, parseInvite, keyCode, parseKeyCode, QR_SEALED, qrSealed, qrKey, parseQrText, VAULT_KEY_RE, vaultKeysIn, vaultKeyFile, unhex }
})()

// ---------------------------------------------------------------- assets/people/evidence.js
const __evidence = (() => {
/**
 * evidence.js: checking a piece of evidence by machine, from the browser. Each check looks for the proof line
 * (pki.sgit.ai=<record fingerprint>, directory.js proofLine) where the evidence says it is:
 *
 *   dns       a TXT record at _pki.sgit.ai.<domain>, read over DNS-over-HTTPS (Cloudflare, then Google), both of
 *             which answer a browser (CORS); the pattern Bluesky uses for domain handles
 *   github    a public gist owned by the account, read from api.github.com, which answers a browser; the gist's
 *             owner must be the account named, so a gist by someone else proves nothing
 *   website   https://<domain>/.well-known/pki.sgit.ai.txt; a site that does not send CORS headers cannot be read
 *             from a browser, and the check says so rather than failing it
 *
 * A check returns { ok: true | false | null, detail }; null is "could not be checked from here", never "false".
 *
 * @module evidence
 */
const { proofLine, hasProof } = __directory

const domainOf = v => String(v || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
const where = (kind, value, fp) => {
    const d = domainOf(value)
    if (kind === 'dns') return { place: `TXT record at _pki.sgit.ai.${d}`, content: proofLine(fp) }
    if (kind === 'website') return { place: `https://${d}/.well-known/pki.sgit.ai.txt`, content: proofLine(fp) }
    if (kind === 'github') return { place: `a public gist owned by github.com/${String(value).replace(/^@/, '')}, its URL given as the evidence URL`, content: proofLine(fp) }
    return null
}
async function check(ev, fp) {
    try {
        if (ev.kind === 'dns') {
            const name = `_pki.sgit.ai.${domainOf(ev.value)}`
            for (const u of [`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`, `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=TXT`]) {
                try {
                    const r = await fetch(u, { headers: { accept: 'application/dns-json' } })
                    if (!r.ok) continue
                    const j = await r.json()
                    const txt = (j.Answer || []).map(a => String(a.data || '').replace(/"\s*"/g, '').replace(/^"|"$/g, '')).join('\n')
                    return hasProof(txt, fp) ? { ok: true, detail: `${name} carries the proof line` } : { ok: false, detail: (j.Answer || []).length ? `${name} has TXT records, none with ${proofLine(fp)}` : `no TXT record at ${name}` }
                } catch (e) { /* the next resolver */ }
            }
            return { ok: null, detail: 'no DNS-over-HTTPS resolver answered' }
        }
        if (ev.kind === 'github') {
            const user = String(ev.value || '').replace(/^@/, '').trim().toLowerCase()
            const id = (/gist\.github\.com\/(?:[^/]+\/)?([0-9a-f]{20,40})/.exec(ev.url || '') || [])[1]
            if (!id) return { ok: false, detail: 'the evidence URL is not a gist' }
            const r = await fetch(`https://api.github.com/gists/${id}`, { headers: { accept: 'application/vnd.github+json' } })
            if (!r.ok) return { ok: r.status === 404 ? false : null, detail: `GitHub answered ${r.status}` }
            const j = await r.json()
            if (String(j.owner && j.owner.login).toLowerCase() !== user) return { ok: false, detail: `the gist belongs to ${j.owner && j.owner.login}, not ${user}` }
            const text = Object.values(j.files || {}).map(f => f.content || '').join('\n')
            return hasProof(text, fp) ? { ok: true, detail: `a gist by ${user} carries the proof line` } : { ok: false, detail: `the gist by ${user} does not contain ${proofLine(fp)}` }
        }
        if (ev.kind === 'website') {
            const u = `https://${domainOf(ev.value)}/.well-known/pki.sgit.ai.txt`
            let r
            try { r = await fetch(u, { cache: 'no-store' }) } catch (e) { return { ok: null, detail: `${u} could not be read from a browser (the site sends no CORS header, or is down): open it yourself` } }
            if (!r.ok) return { ok: false, detail: `${u} answered ${r.status}` }
            return hasProof(await r.text(), fp) ? { ok: true, detail: `${u} carries the proof line` } : { ok: false, detail: `${u} does not contain ${proofLine(fp)}` }
        }
        return { ok: null, detail: 'a person checks this kind' }
    } catch (e) { return { ok: null, detail: String(e && e.message || e) } }
}

return { where, check }
})()

// ---------------------------------------------------------------- assets/people/qrread.js
const __qrread = (() => {
/**
 * qrread.js: reading a QR code out of an image, and writing one as a PNG, with nothing but this file.
 *
 * Why: a sealed vault key travels between two agent sessions as a QR code image that a person carries (saves, uploads,
 * pastes). The receiving agent has the image as a file and no QR library; a browser may have no BarcodeDetector. So:
 *
 *   decodePng(bytes, inflate)   a PNG (8-bit grey, grey+alpha, RGB, RGBA or palette; not interlaced) to luminance
 *   readQr(lum, w, h)           the text of the one QR code an image holds, axis-aligned, with a light margin around it:
 *                               the PNGs this site and the agent tool make, a crop of a screenshot, a photo straight on.
 *                               It samples module centres, reads the format bits (the nearest of the 32 valid ones),
 *                               unmasks, de-interleaves the blocks and reads byte mode. It does not correct errors: a
 *                               misread module gives text that fails to parse or a signature that fails to check,
 *                               never a wrong secret, because everything it carries here is sealed and signed.
 *   encodePng(lum, w, h, deflate)   a grey PNG, for the agent tool's QR files
 *
 * inflate and deflate are passed in (zlib's in Node; DecompressionStream in a browser), so this runs in both.
 * The two tables are the QR standard's, as qrcode-generator 2.0.4 (MIT, vendored in assets/vendor/) carries them.
 *
 * @module qrread
 */

// error-correction blocks, per version and level (L, M, Q, H): [count, total codewords, data codewords] repeated
const RS = [[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]]
// alignment pattern centres, per version
const ALIGN = [[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]]
const LEVEL = { 1: 'L', 0: 'M', 3: 'Q', 2: 'H' }, LEVEL_ROW = { L: 0, M: 1, Q: 2, H: 3 }

// ------------------------------------------------------------ PNG
const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
const crc32 = (bytes) => { let c = 0xffffffff; for (const b of bytes) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const u32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0
async function decodePng(bytes, inflate) {
    bytes = new Uint8Array(bytes)
    const SIG = [137, 80, 78, 71, 13, 10, 26, 10]
    if (!SIG.every((v, i) => bytes[i] === v)) throw new Error('not a PNG')
    let o = 8, w = 0, h = 0, depth = 0, type = 0, interlace = 0, palette = null, trns = null
    const idat = []
    while (o < bytes.length) {
        const len = u32(bytes, o), kind = String.fromCharCode(...bytes.subarray(o + 4, o + 8)), data = bytes.subarray(o + 8, o + 8 + len)
        if (kind === 'IHDR') { w = u32(data, 0); h = u32(data, 4); depth = data[8]; type = data[9]; interlace = data[12] }
        else if (kind === 'PLTE') palette = data
        else if (kind === 'tRNS') trns = data
        else if (kind === 'IDAT') idat.push(data)
        else if (kind === 'IEND') break
        o += 12 + len
    }
    if (!w || !h || w * h > 40e6) throw new Error('a PNG with no size, or too large')
    if (depth !== 8 || interlace) throw new Error('only 8-bit, non-interlaced PNGs are read here (save the image again as a plain PNG)')
    const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type]
    if (!ch) throw new Error('an unknown PNG colour type')
    const all = new Uint8Array(idat.reduce((s, d) => s + d.length, 0)); let p = 0; for (const d of idat) { all.set(d, p); p += d.length }
    const raw = new Uint8Array(await inflate(all)), stride = w * ch, px = new Uint8Array(stride * h)
    for (let y = 0; y < h; y++) {
        const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = y * stride
        for (let x = 0; x < stride; x++) {
            const a = x >= ch ? px[row + x - ch] : 0, b = y ? px[row - stride + x] : 0, c = x >= ch && y ? px[row - stride + x - ch] : 0
            let v = src[x]
            if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1
            else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
            px[row + x] = v & 255
        }
    }
    const lum = new Uint8Array(w * h)
    for (let i = 0; i < w * h; i++) {
        let r, g, bl, al = 255
        if (type === 3) { const k = px[i]; r = palette[k * 3]; g = palette[k * 3 + 1]; bl = palette[k * 3 + 2]; if (trns && k < trns.length) al = trns[k] }
        else if (type === 0 || type === 4) { r = g = bl = px[i * ch]; if (type === 4) al = px[i * ch + 1] }
        else { r = px[i * ch]; g = px[i * ch + 1]; bl = px[i * ch + 2]; if (type === 6) al = px[i * ch + 3] }
        const y = 0.299 * r + 0.587 * g + 0.114 * bl
        lum[i] = Math.round(y * al / 255 + 255 * (1 - al / 255))           // on white, as it is shown
    }
    return { lum, w, h }
}
async function encodePng(lum, w, h, deflate) {
    const raw = new Uint8Array((w + 1) * h)
    for (let y = 0; y < h; y++) raw.set(lum.subarray(y * w, (y + 1) * w), y * (w + 1) + 1)
    const chunk = (kind, data) => {
        const out = new Uint8Array(12 + data.length), k = new TextEncoder().encode(kind)
        out.set([data.length >>> 24, (data.length >>> 16) & 255, (data.length >>> 8) & 255, data.length & 255]); out.set(k, 4); out.set(data, 8)
        const c = crc32(out.subarray(4, 8 + data.length)); out.set([c >>> 24, (c >>> 16) & 255, (c >>> 8) & 255, c & 255], 8 + data.length)
        return out
    }
    const ihdr = new Uint8Array(13); ihdr.set([w >>> 24, (w >>> 16) & 255, (w >>> 8) & 255, w & 255, h >>> 24, (h >>> 16) & 255, (h >>> 8) & 255, h & 255, 8, 0, 0, 0, 0])
    const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', new Uint8Array(await deflate(raw))), chunk('IEND', new Uint8Array(0))]
    const out = new Uint8Array(parts.reduce((s, x) => s + x.length, 0)); let o = 0; for (const x of parts) { out.set(x, o); o += x.length }
    return out
}

// ------------------------------------------------------------ the QR code
const MASKS = [
    (i, j) => (i + j) % 2 === 0, (i) => i % 2 === 0, (i, j) => j % 3 === 0, (i, j) => (i + j) % 3 === 0,
    (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0, (i, j) => (i * j) % 2 + (i * j) % 3 === 0,
    (i, j) => ((i * j) % 2 + (i * j) % 3) % 2 === 0, (i, j) => ((i * j) % 3 + (i + j) % 2) % 2 === 0]
function bchFormat(data) {
    const digits = d => { let n = 0; while (d) { n++; d >>>= 1 } return n }
    let d = data << 10
    while (digits(d) - digits(0x537) >= 0) d ^= 0x537 << (digits(d) - digits(0x537))
    return ((data << 10) | d) ^ 0x5412
}
const FORMATS = []; for (let ec = 0; ec < 4; ec++) for (let m = 0; m < 8; m++) FORMATS.push({ bits: bchFormat((ec << 3) | m), level: LEVEL[ec], mask: m })
const popcount = x => { let n = 0; while (x) { n += x & 1; x >>>= 1 } return n }

/** The modules that are not data: finders and separators, timing, alignment, format and version areas, the dark module. */
function functionMap(n, version) {
    const f = Array.from({ length: n }, () => new Uint8Array(n)), set = (r, c) => { if (r >= 0 && c >= 0 && r < n && c < n) f[r][c] = 1 }
    for (const [r0, c0] of [[0, 0], [0, n - 8], [n - 8, 0]]) for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) set(r0 + r, c0 + c)
    for (let i = 0; i < n; i++) { set(6, i); set(i, 6) }
    const pos = ALIGN[version - 1]
    for (const r of pos) for (const c of pos) {
        if ((r < 9 && c < 9) || (r < 9 && c > n - 10) || (r > n - 10 && c < 9)) continue
        for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) set(r + dr, c + dc)
    }
    for (let i = 0; i < 9; i++) { set(8, i); set(i, 8) }
    for (let i = 0; i < 8; i++) { set(8, n - 1 - i); set(n - 1 - i, 8) }
    if (version >= 7) for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { set(i, n - 11 + j); set(n - 11 + j, i) }
    return f
}
/** The grid of modules, sampled from the image: true is dark. */
function sample(lum, w, h, nWanted) {
    let lo = 255, hi = 0; for (const v of lum) { if (v < lo) lo = v; if (v > hi) hi = v }
    if (hi - lo < 60) throw new Error('no contrast: this image holds no QR code')
    const t = (lo + hi) / 2, dark = (x, y) => lum[y * w + x] < t
    let top = -1, bottom = -1, left = w, right = -1
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (dark(x, y)) { if (top < 0) top = y; bottom = y; if (x < left) left = x; if (x > right) right = x }
    if (top < 0) throw new Error('no dark pixels')
    // the top-left finder's first row is seven dark modules
    let run = 0; const ry = top + 1 < h ? top + 1 : top
    let x0 = left; while (x0 < w && !dark(x0, ry)) x0++
    while (x0 + run < w && dark(x0 + run, ry)) run++
    const est = run / 7, width = right - left + 1, height = bottom - top + 1
    if (!nWanted) {                                         // the sizes it could be: blur makes the finder look thinner
        const guess = width / est, out = []
        for (let v = 1; v <= 40; v++) { const m = 17 + 4 * v; if (Math.abs(m - guess) <= Math.max(4, guess * 0.15)) out.push(m) }
        return out.sort((a, b) => Math.abs(a - guess) - Math.abs(b - guess))
    }
    const n = nWanted
    let mx = width / n, my = height / n, ox = left, oy = top
    const rad = Math.max(0, Math.floor(Math.min(mx, my) * 0.2))
    const at = (cx, cy) => {
        cx = Math.floor(cx); cy = Math.floor(cy)
        let s = 0, k = 0
        for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < w && y < h) { s += lum[y * w + x]; k++ } }
        return k ? s / k < t : false
    }
    // calibrate the grid on the timing patterns (row 6 and column 6 alternate, dark on even modules): an edge measured a
    // pixel off, over a hundred modules, is enough to sample the wrong ones at the far side of a large code
    const fit = (horizontal) => {
        let bestO = horizontal ? ox : oy, bestM = horizontal ? mx : my, bestS = -1
        const o0 = bestO, m0 = bestM
        for (let dm = -0.012; dm <= 0.0121; dm += 0.0015) for (let doff = -0.5; doff <= 0.51; doff += 0.125) {
            const m = m0 * (1 + dm), o = o0 + doff * m0
            // row (or column) 6 end to end: the finders' dark edge, the light separators, and the timing between
            let sc = 0
            for (let i = 0; i < n; i++) {
                const want = i < 7 || i > n - 8 ? true : i === 7 || i === n - 8 ? false : i % 2 === 0
                const d = horizontal ? at(o + (i + 0.5) * m, oy + 6.5 * my) : at(ox + 6.5 * mx, o + (i + 0.5) * m)
                if (d === want) sc++
            }
            sc -= (Math.abs(dm) * 10 + Math.abs(doff)) * 0.01               // a tie goes to the smallest correction
            if (sc > bestS) { bestS = sc; bestO = o; bestM = m }
        }
        if (horizontal) { ox = bestO; mx = bestM } else { oy = bestO; my = bestM }
    }
    for (let pass = 0; pass < 2; pass++) { fit(true); fit(false) }
    return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => at(ox + (c + 0.5) * mx, oy + (r + 0.5) * my)))
}
function readQr(lum, w, h) {
    let last = null
    for (const n of sample(lum, w, h)) { try { return readAt(sample(lum, w, h, n)) } catch (e) { last = e } }
    throw last || new Error('no QR code found')
}
function readAt(g) {
    const n = g.length, version = (n - 17) / 4
    // the format bits, the copy down column 8 (rows 0-5, 7, 8, then the bottom-left run), as the generator places them
    let fmt = 0
    for (let i = 0; i < 15; i++) { const r = i < 6 ? i : i < 8 ? i + 1 : n - 15 + i; if (g[r][8]) fmt |= 1 << i }
    let fmt2 = 0
    for (let i = 0; i < 15; i++) { const c = i < 8 ? n - i - 1 : i < 9 ? 15 - i : 15 - i - 1; if (g[8][c]) fmt2 |= 1 << i }
    let best = null
    for (const f of FORMATS) for (const x of [fmt, fmt2]) { const d = popcount(f.bits ^ x); if (!best || d < best.d) best = { ...f, d } }
    if (best.d > 3) throw new Error('the format bits do not read: not a QR code, or not straight on')
    const fn = functionMap(n, version), mask = MASKS[best.mask], bits = []
    let up = true
    for (let col = n - 1; col > 0; col -= 2) {
        if (col === 6) col -= 1
        for (let k = 0; k < n; k++) {
            const row = up ? n - 1 - k : k
            for (let c = 0; c < 2; c++) { const cc = col - c; if (!fn[row][cc]) bits.push(g[row][cc] !== mask(row, cc) ? 1 : 0) }
        }
        up = !up
    }
    const cws = []; for (let i = 0; i + 8 <= bits.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; cws.push(b) }
    // de-interleave: the data codewords of every block, a byte from each in turn
    const row = RS[(version - 1) * 4 + LEVEL_ROW[best.level]], blocks = []
    for (let i = 0; i < row.length; i += 3) for (let j = 0; j < row[i]; j++) blocks.push({ total: row[i + 1], data: row[i + 2], out: [] })
    const maxData = Math.max(...blocks.map(b => b.data)); let p = 0
    for (let i = 0; i < maxData; i++) for (const b of blocks) if (i < b.data) b.out.push(cws[p++])
    const data = blocks.flatMap(b => b.out)
    // byte-mode segments, until the terminator
    let bit = 0
    const take = (k) => { let v = 0; for (let i = 0; i < k; i++) { const byte = data[(bit >> 3)]; v = (v << 1) | ((byte >> (7 - (bit & 7))) & 1); bit++ } return v }
    const out = []
    while (bit + 4 <= data.length * 8) {
        const mode = take(4)
        if (mode === 0) break
        if (mode !== 4) throw new Error(`a QR segment in mode ${mode}: only byte mode is read here`)
        const len = take(version < 10 ? 8 : 16)
        if (bit + len * 8 > data.length * 8) throw new Error('the QR data runs past its end: misread')
        for (let i = 0; i < len; i++) out.push(take(8))
    }
    if (!out.length) throw new Error('no data in the QR code: misread')
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(out))
}

return { decodePng, encodePng, readQr }
})()

// ---------------------------------------------------------------- assets/people/unzip.js
const __unzip = (() => {
/**
 * unzip.js: the files in a zip, read here, so a batch of QR codes (an agent hands over eight at once) can be brought as
 * one file. Stored and deflated entries only, read from the central directory; names are kept as labels and never used
 * as paths. Bounded, because a zip is someone else's file: at most 200 entries, 10 MB an entry and 60 MB in all once
 * inflated, and an entry that inflates past its declared size is refused (a zip bomb stops at the bound, not at the
 * memory's end).
 *
 *   unzip(bytes, inflateRaw) -> [{ name, bytes } | { name, error }]     inflateRaw(data, max): zlib's inflateRawSync with maxOutputLength
 *                                                       in Node; DecompressionStream('deflate-raw'), read until max, in a browser
 *
 * @module unzip
 */
const LIMITS = { entries: 200, entry: 10 * 1024 * 1024, total: 60 * 1024 * 1024 }
const u16 = (b, o) => b[o] | (b[o + 1] << 8), u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0
const isZip = b => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04

async function unzip(bytes, inflateRaw) {
    const b = new Uint8Array(bytes)
    let eocd = -1
    for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (u32(b, i) === 0x06054b50) { eocd = i; break }
    if (eocd < 0) throw new Error('not a zip (no central directory)')
    const count = u16(b, eocd + 10), cdOffset = u32(b, eocd + 16)
    if (count > LIMITS.entries) throw new Error(`${count} entries: more than the ${LIMITS.entries} read here`)
    const out = [], td = new TextDecoder()
    let p = cdOffset, total = 0
    for (let n = 0; n < count; n++) {
        if (u32(b, p) !== 0x02014b50) throw new Error('a broken central directory')
        const method = u16(b, p + 10), csize = u32(b, p + 20), usize = u32(b, p + 24), nlen = u16(b, p + 28), xlen = u16(b, p + 30), clen = u16(b, p + 32), local = u32(b, p + 42)
        const name = td.decode(b.subarray(p + 46, p + 46 + nlen))
        p += 46 + nlen + xlen + clen
        if (name.endsWith('/') || /(^|\/)(__MACOSX|\.DS_Store)/.test(name)) continue
        if (usize > LIMITS.entry || (total += usize) > LIMITS.total) throw new Error(`${name}: larger than this page reads (${LIMITS.entry / 1048576} MB a file, ${LIMITS.total / 1048576} MB in all)`)
        if (u32(b, local) !== 0x04034b50) throw new Error(`${name}: a broken entry`)
        const start = local + 30 + u16(b, local + 26) + u16(b, local + 28), data = b.subarray(start, start + csize)
        // an entry that does not read is that entry's error, not the whole zip's: the others are still read
        const short = name.split('/').pop()
        try {
            let content
            if (method === 0) content = data
            else if (method === 8) content = new Uint8Array(await inflateRaw(data, usize + 1))      // stops one byte past what it declares
            else throw new Error(`compressed in a way not read here (method ${method})`)
            if (content.length !== usize) throw new Error(`inflates past the ${usize} bytes it declares: refused`)
            out.push({ name: short, bytes: content })
        } catch (e) { out.push({ name: short, error: e.message }) }
    }
    return out
}

/** The browser's inflate, stopping at max bytes: a stream read chunk by chunk, cancelled past the bound. */
async function inflateRawBrowser(data, max) {
    const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader()
    const parts = []; let n = 0
    for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        parts.push(value); n += value.length
        if (n > max) { await reader.cancel(); break }
    }
    const out = new Uint8Array(n); let o = 0; for (const x of parts) { out.set(x, o); o += x.length }
    return out
}

return { LIMITS, isZip, unzip, inflateRawBrowser }
})()

// ---------------------------------------------------------------- the tool (agents/pki-agent.src.mjs)
const K = __keys
const D = __directory
const M = __message
const EV = __evidence
const QR = __qrread
const Z = __unzip
const { qrcode } = __qrcode

const HOME = process.env.PKI_AGENT_HOME || path.join(os.homedir(), '.sg-send')
const KEYS = path.join(HOME, 'keys'), PKI = path.join(HOME, 'pki'), RECORDS = path.join(PKI, 'records')
const REGISTER = (process.env.PKI_REGISTER || 'https://pki.sgit.ai/').replace(/\/?$/, '/')
const PASS = process.env.SG_SEND_PASSPHRASE || ''
const say = (...a) => console.log(...a), die = m => { console.error('pki-agent: ' + m); process.exit(1) }

// ------------------------------------------------------------ arguments
const [cmd = 'help', ...rest] = process.argv.slice(2)
const flags = {}, args = []
for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (a.startsWith('--')) { const [k, v] = a.slice(2).split('='); flags[k] = v != null ? v : (rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true) }
    else args.push(a)
}

// ------------------------------------------------------------ the key store (sgit's layout) and the agent's record
const writeSecret = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true, mode: 0o700 }); fs.writeFileSync(f, text, { mode: 0o600 }) }
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'))
const state = () => fs.existsSync(path.join(PKI, 'agent.json')) ? readJson(path.join(PKI, 'agent.json')) : {}
async function saveKey(id) {
    const dir = path.join(KEYS, id.bundle.fingerprint.replace(':', '_'))
    const priv = async der => PASS ? K.encryptPrivate(der, PASS) : K.pem(der, 'PRIVATE KEY')
    writeSecret(path.join(dir, 'private_key.pem'), await priv(id.private.encrypt))
    writeSecret(path.join(dir, 'signing_private.pem'), await priv(id.private.sign))
    fs.writeFileSync(path.join(dir, 'public_key.pem'), id.bundle.encrypt)
    fs.writeFileSync(path.join(dir, 'signing_public.pem'), id.bundle.sign)
    fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify({ label: id.bundle.label, algorithm: 'RSA-OAEP', key_size: 4096, encryption_fingerprint: id.bundle.fingerprint, signing_fingerprint: id.bundle.signing_fingerprint, created: id.created }, null, 2))
    return dir
}
async function loadKey(fp) {
    for (const d of fs.existsSync(KEYS) ? fs.readdirSync(KEYS) : []) {
        const meta = path.join(KEYS, d, 'metadata.json')
        if (!fs.existsSync(meta)) continue
        const m = readJson(meta)
        if (m.signing_fingerprint !== fp && m.encryption_fingerprint !== fp) continue
        try { return await K.importKeystore({ privateKeyPem: fs.readFileSync(path.join(KEYS, d, 'private_key.pem'), 'utf8'), signingPrivatePem: fs.readFileSync(path.join(KEYS, d, 'signing_private.pem'), 'utf8'), passphrase: PASS, label: m.label, created: m.created }) }
        catch (e) { die(`the key ${fp} is in ${path.join(KEYS, d)} but does not open: ${e.message}${PASS ? '' : ' (set SG_SEND_PASSPHRASE)'}`) }
    }
    return null
}
async function me() {
    if (process.env.PKI_AGENT_KEY && !flags.key) {
        let k; try { k = JSON.parse(process.env.PKI_AGENT_KEY) } catch (e) { die('PKI_AGENT_KEY is not the JSON keyfile prints') }
        try { return await K.importKeystore({ privateKeyPem: k.private_key, signingPrivatePem: k.signing_private, passphrase: PASS, label: k.label || '', created: k.created || 0 }) }
        catch (e) { die(`PKI_AGENT_KEY does not open: ${e.message}${PASS ? '' : ' (set SG_SEND_PASSPHRASE)'}`) }
    }
    const fp = flags.key || state().default
    if (!fp) die('no key yet: node pki-agent.mjs keygen --name "<what this agent is>"')
    const id = await loadKey(fp)
    if (!id) die(`the key ${fp} is not in ${KEYS}: it lived in another session or machine. Make a new one (keygen).`)
    return id
}
const recDir = fp => path.join(RECORDS, K.dirOf(fp))
function statements(fp) { const d = recDir(fp); return fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.json')).sort().map(f => readJson(path.join(d, f))) : [] }
function keep(st) { const d = recDir(st.record), n = statements(st.record).length + 1; fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, `${String(n).padStart(2, '0')}__${st.type}.json`), JSON.stringify(st, null, 2)); return st }
async function register() {
    const r = await fetch(REGISTER + 'directory/index.json'); if (!r.ok) die(`the register did not answer (${r.status})`)
    const index = await r.json(), records = []
    for (const x of index.records) { const rec = await D.readRecord(x.statements, { dir: x.fp, fixture: x.fixture }); rec.dir = x.dir; records.push(rec) }
    return { index, records, byFp: new Map(records.map(r => [r.fp, r])), graph: D.graph(records, { anchors: index.anchors }) }
}

// ------------------------------------------------------------ the pinned root, and trust from it
const ROOTF = path.join(PKI, 'root.json')
function pinned() {
    if (process.env.PKI_ROOT) return { fp: process.env.PKI_ROOT.trim(), dns: (process.env.PKI_ROOT_DNS || '').trim(), from: 'PKI_ROOT' }
    return fs.existsSync(ROOTF) ? { ...readJson(ROOTF), from: ROOTF } : null
}
/** The pinned root, checked: in the register, unrevoked, and in DNS when the pin names a domain. The graph from it alone. */
async function fromRoot(reg) {
    const p = pinned()
    if (!p) die('no root pinned. node pki-agent.mjs pin <the root fingerprint your instructions give> [--dns <domain>] (or set PKI_ROOT)')
    if (!K.FP.test(p.fp)) die(`the pinned root ${p.fp} is not a sha256:<16 hex> fingerprint`)
    const rec = reg.byFp.get(p.fp)
    if (!rec || !rec.ok || rec.revoked) die(`the pinned root ${p.fp} is not a live record in the register: refusing`)
    const notes = []
    if (!reg.index.anchors.includes(p.fp)) notes.push(`the register's anchors.json does not name ${p.fp}: trusting the pin, not the site`)
    const domains = new Set([...(p.dns ? [p.dns] : []), ...rec.evidence.filter(e => e.kind === 'dns').map(e => e.value)])
    for (const d of domains) {
        const r = await EV.check({ kind: 'dns', value: d }, p.fp)
        if (r.ok === false) die(`DNS disagrees with the pinned root: ${r.detail}. Refusing.`)
        if (r.ok !== true && d === p.dns && !flags['no-dns']) die(`the pin requires DNS at ${d}, and it could not be checked (${r.detail}). Refusing (--no-dns to go on without it).`)
        notes.push(`DNS ${d}: ${r.ok === true ? 'carries the root' : 'not checked'} (${r.detail})`)
    }
    return { p, rec, notes, g: D.graph(reg.records, { anchors: [p.fp] }) }
}
/** Refuse a recipient the pinned root does not vouch for, unless --unverified says to. Returns the trust found. */
async function vouched(reg, fp) {
    if (flags.unverified) { console.error(`pki-agent: --unverified: sealing to ${fp} without checking it chains to a root`); return null }
    const { g, p, notes } = await fromRoot(reg)
    for (const n of notes) console.error('pki-agent: ' + n)
    const t = D.trustFrom(g, fp, p.fp)
    if (!t.ok) die(`refusing to seal to ${fp}: ${t.why}. It must be the pinned root (${p.fp}), verified by it, a persona of it, or an agent it operates, in date. (--unverified to override, knowingly.)`)
    if (t.policy_agrees === false) die(`refusing: the operator authorised policy ${t.policy}, the agent claims ${t.claimed_policy}`)
    console.error(`pki-agent: ${fp} chains to the root: ${t.chain.join(' → ')}${t.until ? `, until ${t.until}` : ''}${t.policy ? `, policy ${t.policy}` : ''}`)
    return t
}
/** A QR code as an SVG file: the same drawing the site's pages make. */
function svgOf(text) {
    const q = qrcode(0, 'L'); q.addData(String(text), 'Byte'); q.make()
    const n = q.getModuleCount(), m = 4, size = n + m * 2
    let d = ''
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { if (!q.isDark(r, c)) continue; let run = 1; while (c + run < n && q.isDark(r, c + run)) run++; d += `M${c + m} ${r + m}h${run}v1h-${run}z`; c += run - 1 }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size * 8}" height="${size * 8}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>\n`
}
/** A QR code file: PNG (8 pixels a module) or SVG, by the name's extension. Its text is the strict JSON an agent reads
    (message.js qrSealed / qrKey), or the plain link with --qr-link, for a phone's camera. */
async function qrOut(text, file) {
    if (!file || file === true) return
    if (text.length > M.MAX_QR_CHARS) { console.error(`pki-agent: ${text.length} characters: too long for one QR code; the link still works`); return }
    if (/\.svg$/i.test(file)) fs.writeFileSync(file, svgOf(text))
    else {
        const q = qrcode(0, 'L'); q.addData(String(text), 'Byte'); q.make()
        const n = q.getModuleCount(), m = 4, px = 8, size = (n + m * 2) * px, lum = new Uint8Array(size * size).fill(255)
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) for (let y = 0; y < px; y++) lum.fill(0, ((r + m) * px + y) * size + (c + m) * px, ((r + m) * px + y) * size + (c + m + 1) * px)
        const png = await QR.encodePng(lum, size, size, d => zlib.deflateSync(d))
        if (QR.readQr((await QR.decodePng(png, d => zlib.inflateSync(d))).lum, size, size) !== text) die('the QR code did not read back: not written')
        fs.writeFileSync(file, png)
    }
    say(`QR code: ${path.resolve(file)} (${/^\{/.test(text) ? 'strict JSON, for an agent' : 'a link, for a phone'})`)
}
/** What a QR code image holds, read and checked against the two shapes this site makes; nothing else gets through. */
async function fromQrImage(file) {
    const img = await QR.decodePng(fs.readFileSync(file), d => zlib.inflateSync(d))
    let text; try { text = QR.readQr(img.lum, img.w, img.h) } catch (e) { die(`${file}: no QR code read (${e.message}). Save the image as a PNG, cropped to the code, and try again.`) }
    try { return M.parseQrText(text) } catch (e) { die(`${file}: ${e.message}`) }
}
const inflateRaw = (d, max) => { try { return zlib.inflateRawSync(d, { maxOutputLength: max }) } catch (e) { throw new Error('an entry inflates past what it declares: refused') } }
/** Every source behind the arguments, a zip opened into its entries: [{ name, src | bytes }]. */
async function expand(list) {
    const out = []
    for (const a of list) {
        if (/\.zip$/i.test(a) && fs.existsSync(a)) { let es; try { es = await Z.unzip(fs.readFileSync(a), inflateRaw) } catch (e) { die(`${a}: ${e.message}`) } for (const e of es) out.push({ name: `${a} › ${e.name}`, bytes: e.bytes, error: e.error }) }
        else out.push({ name: a, src: a })
    }
    return out
}
/** What one entry of a zip holds: a PNG read as a QR code, or text in one of the two shapes. */
async function entryOf(e) {
    if (e.error) throw new Error(e.error)
    const b = e.bytes
    if (b[0] === 0x89 && b[1] === 0x50) { const img = await QR.decodePng(b, d => zlib.inflateSync(d)); return M.parseQrText(QR.readQr(img.lum, img.w, img.h)) }
    return M.parseQrText(new TextDecoder('utf-8', { fatal: true }).decode(b))
}
/** Where a sealed code comes from: a QR image, a file of strict JSON, a link, an m1 code, or an .enc file. */
async function sourceOf(src) {
    if (/\.png$/i.test(src) && fs.existsSync(src)) return fromQrImage(src)
    const text = fs.existsSync(src) ? fs.readFileSync(src, 'utf8').trim() : String(src).trim()
    if (text.startsWith('{') || /^(https:\/\/pki\.sgit\.ai\/|m1\.|k1\.)/.test(text)) { try { return M.parseQrText(text) } catch (e) { die(e.message) } }
    return { kind: 'enc', enc: text }
}
const qrTextOf = (sealed, to, from) => flags['qr-link'] ? sealed.url : M.qrSealed({ to, from, code: sealed.code })
const policyOf = v => { if (!v) return ''; if (D.POLICY.test(String(v))) return String(v); if (!fs.existsSync(String(v))) die(`--policy ${v}: neither a sha256:<64 hex> nor a file`); return null }
async function policyHash(v) { const p = policyOf(v); return p !== null ? p : 'sha256:' + await K.sha256hex(fs.readFileSync(String(v))) }
const expiresIn = days => days ? new Date(Date.now() + Number(days) * 86400000).toISOString() : ''

/** This tool, run again on one item: a batch opens each message exactly as a single open does. */
function spawnSelf(argv) {
    try { return { ok: true, out: execFileSync(process.execPath, [process.argv[1], ...argv], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: process.env }) } }
    catch (e) { return { ok: false, err: String(e.stderr || e.message) } }
}
// ------------------------------------------------------------ the commands
const commands = {
    async help() {
        say(`pki-agent: an agent's identity on pki.sgit.ai (${REGISTER})

  keygen --name N [--about A] [--runtime R] [--session]   make this agent's key and sign its identity
  operator <fingerprint> [--policy FILE|HASH]              link to the key that operates this agent
  submission [--out FILE]                                  the signed record, to hand to the operator
  submit                                                   send it, sealed, into the operator's inbox
  status                                                   what the register says about this agent
  whoami                                                   this agent's fingerprints
  send --to FP --text T [--subject S] [--expires DAYS] [--qr F.svg]   a message sealed to someone the root vouches for
  seal [--to FP,FP] (--file F | --text T) [--name N] [--expires DAYS] [--qr F.svg]
                                                           a secret (a vault key) sealed to the root by default,
                                                           or to keys it vouches for; one link each
  pin <root fingerprint> [--dns DOMAIN]                    the root to trust, given out of band (or PKI_ROOT)
  root                                                     check the pinned root: register, anchors, DNS
  trust <fingerprint>                                      does it chain to the pinned root? (and its policy)
  keyqr [--out F.png]                                      this agent's public key as a link and a QR code
  read-qr <image.png | batch.zip> […]                      what QR images hold, checked (never the secret)
  QR files: --qr / --out F.png (or .svg); strict JSON for an agent by default, --qr-link for a phone's camera
  seal --from-vault DIR: the vault key straight from sgit vault show-key, never printed
  policy <file>                                            the sha256 a link names a behaviour policy by
  open <qr.png | batch.zip | link | m1… | file.enc> […] [--save DIR]   open messages sealed to this agent (a batch:
                                                           one JSON line each)
  sign <file>                                              a signature sgit pki verify checks (file.sig)
  link <fingerprint> [--method known]                      link to any key in the register
  evidence --kind link|website|github|dns|key --value V [--url U]   a signed claim, e.g. the session's own URL
  keyfile                                                  this key as one line, for a PKI_AGENT_KEY secret (encrypted
                                                           when SG_SEND_PASSPHRASE is set; then that is a secret too)

Keys: ${KEYS} (sgit's layout${PASS ? ', encrypted with SG_SEND_PASSPHRASE' : ', plain, 0600: set SG_SEND_PASSPHRASE to encrypt'}).`)
    },
    async keygen() {
        if (!flags.name) die('keygen --name "<what this agent is>"')
        const id = await K.generate(String(flags.label || flags.name).slice(0, 80))
        const dir = await saveKey(id)
        const st = keep(await D.agentStatement(id, { name: flags.name, about: flags.about || '', runtime: flags.runtime || '', session: !!flags.session }))
        fs.mkdirSync(PKI, { recursive: true }); fs.writeFileSync(path.join(PKI, 'agent.json'), JSON.stringify({ ...state(), default: id.bundle.signing_fingerprint }, null, 2))
        say(`made: ${id.bundle.signing_fingerprint}  (record; encryption key ${id.bundle.fingerprint})`)
        say(`private halves: ${dir}${PASS ? ' (encrypted)' : ' (plain, 0600)'}; they stay here`)
        say(`identity signed (${st.created_at}). Next: node pki-agent.mjs operator <your operator's fingerprint>`)
    },
    async operator() {
        const fp = args[0]; if (!K.FP.test(String(fp))) die('operator <sha256:16 hex>')
        const id = await me(), policy = await policyHash(flags.policy)
        keep(await D.linkStatement(id, { to: fp, method: 'operated-by', policy }))
        say(`linked to ${fp} as its operator${policy ? `, under policy ${policy}` : ''}. Next: node pki-agent.mjs submission (or submit), and ask them to confirm it.`)
    },
    async link() {
        const fp = args[0]; if (!K.FP.test(String(fp))) die('link <sha256:16 hex>')
        keep(await D.linkStatement(await me(), { to: fp, method: flags.method || 'known' })); say(`linked to ${fp}`)
    },
    async evidence() {
        if (!D.EVIDENCE[flags.kind] || !flags.value) die('evidence --kind link|website|github|dns|key --value V [--url https://…]')
        keep(await D.evidenceStatement(await me(), { kind: flags.kind, value: flags.value, url: flags.url || '' })); say('evidence signed')
    },
    async whoami() { const id = await me(); say(JSON.stringify({ record: id.bundle.signing_fingerprint, encryption: id.bundle.fingerprint, label: id.bundle.label, keys: KEYS }, null, 2)) },
    async submission() {
        const id = await me(), sts = statements(id.bundle.signing_fingerprint)
        const r = await D.readRecord(sts); if (!r.ok) die('the record does not read cleanly: ' + r.problems.join('; '))
        const text = JSON.stringify(D.submission(sts), null, 1)
        if (flags.out) { fs.writeFileSync(flags.out, text); say(`written: ${flags.out} (${sts.length} statements, record ${r.fp})`) } else say(text)
    },
    async submit() {
        const id = await me(), fp = id.bundle.signing_fingerprint, sts = statements(fp)
        const r = await D.readRecord(sts); if (!r.ok) die('the record does not read cleanly: ' + r.problems.join('; '))
        const op = (r.links.find(l => l.method === 'operated-by') || {}).to || flags.to
        if (!op) die('no operator: node pki-agent.mjs operator <fingerprint> first')
        const reg = await register(), opRec = reg.byFp.get(op)
        if (!opRec) die(`the operator ${op} is not in the register; hand them the submission instead (submission --out FILE)`)
        if (!opRec.inbox) die(`${opRec.name} has no inbox on their record; hand them the submission instead (submission --out FILE)`)
        const msg = await M.compose({ to: opRec.bundle, from: id, subject: `An agent asks to be confirmed: ${r.name}`, text: `${r.name} (${fp}) asks ${opRec.name} to confirm they operate it. Compare this fingerprint with the one the agent printed in its session before confirming.`,
            files: [{ name: 'submission.json', type: 'application/json', data: K.utf8(JSON.stringify(D.submission(sts), null, 1)) }] })
        const sealed = await M.sealMessage(msg, opRec.bundle, id)
        const w = await fetch(`${opRec.inbox.endpoint}/api/vault/append/write/${opRec.inbox.vault}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ append_token: opRec.inbox.token, payload: btoa(M.parseCode(sealed.code).enc) }) })
        if (!w.ok) die(`the inbox answered ${w.status}`)
        say(`sent, sealed to ${opRec.name}'s key, into their inbox. They confirm it from pki.sgit.ai/vault/ (Agents). Fingerprint to read them: ${fp}`)
    },
    async status() {
        const id = await me(), fp = id.bundle.signing_fingerprint, reg = await register()
        if (!reg.byFp.has(fp)) return say(`${fp}: not in the register yet (${statements(fp).length} statements kept here, not yet added)`)
        say(`${fp}: ${D.standing(reg.graph, fp).text}`)
    },
    async send() {
        const id = await me(), reg = await register(), to = reg.byFp.get(flags.to)
        if (!to) die(`--to ${flags.to}: not in the register`)
        await vouched(reg, to.fp)
        const vk = M.vaultKeysIn(String(flags.text || ''))                 // a vault key in the text goes as a file
        const sealed = await M.sealMessage(await M.compose({ to: to.bundle, from: id, subject: flags.subject || '', text: vk.text, files: vk.keys.map(M.vaultKeyFile), expires: expiresIn(flags.expires) }), to.bundle, id)
        say(sealed.url); await qrOut(qrTextOf(sealed, to.fp, id.bundle.signing_fingerprint), flags.qr)
    },
    async seal() {
        const id = await me(), reg = await register()
        const tos = String(flags.to && flags.to !== true ? flags.to : (pinned() || {}).fp || '').split(',').map(x => x.trim()).filter(Boolean)
        if (!tos.length) die('seal: --to FP, or pin a root to seal to it by default')
        let data, name = flags.name && flags.name !== true ? String(flags.name) : ''
        if (flags['from-vault']) {
            // the vault key straight from sgit, into memory: it is never printed, never written to a file here
            const dir = flags['from-vault'] === true ? '.' : String(flags['from-vault'])
            let out; try { out = execFileSync('sgit', ['vault', 'show-key'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) } catch (e) { die(`sgit vault show-key in ${dir} failed: is it an sgit vault, and is sgit installed?`) }
            const m = new RegExp('sgit_private_' + 'vault_[A-Za-z0-9]+:[a-z0-9]+').exec(out)
            if (!m) die('sgit vault show-key printed no vault key that this tool recognises: nothing sealed')
            data = K.utf8(m[0]); name = name || `vault key: ${m[0].split(':').pop()}`
        } else if (flags.file) { data = fs.readFileSync(String(flags.file)); name = name || path.basename(String(flags.file)) } else if (flags.text) data = K.utf8(String(flags.text))
        else die('seal: --from-vault DIR, --file F or --text T (never paste a key on the command line: --text is for tests)')
        for (const fp of tos) {
            const to = reg.byFp.get(fp); if (!to) die(`${fp}: not in the register`)
            await vouched(reg, fp)
            const m = await M.compose({ to: to.bundle, from: id, subject: `A secret: ${name || 'unnamed'}`, text: `Sealed to ${fp} by ${id.bundle.signing_fingerprint}. Open it with your key; the secret is the file inside.`, files: [{ name: name || 'secret.txt', type: 'application/octet-stream', data }], expires: expiresIn(flags.expires || 7) })
            const sealed = await M.sealMessage(m, to.bundle, id)
            say(`${to.name} (${fp}):`); say(sealed.url)
            await qrOut(qrTextOf(sealed, fp, id.bundle.signing_fingerprint), flags.qr && flags.qr !== true ? (tos.length > 1 ? String(flags.qr).replace(/(\.(svg|png))?$/i, m => `-${K.dirOf(fp)}${m || '.png'}`) : String(flags.qr)) : '')
        }
    },
    async pin() {
        const fp = args[0]; if (!K.FP.test(String(fp))) die('pin <sha256:16 hex> [--dns domain]')
        fs.mkdirSync(PKI, { recursive: true })
        fs.writeFileSync(ROOTF, JSON.stringify({ fp, dns: flags.dns && flags.dns !== true ? String(flags.dns) : '', pinned_at: new Date().toISOString() }, null, 2))
        say(`pinned: ${fp}${flags.dns ? ` (and DNS at _pki.sgit.ai.${flags.dns})` : ''}. Only pin a fingerprint you were given out of band, never one read from the register.`)
    },
    async root() {
        const { p, rec, notes } = await fromRoot(await register())
        say(`root: ${rec.name} (${p.fp}), pinned from ${p.from}`); for (const n of notes) say('  ' + n)
    },
    async trust() {
        const fp = args[0]; if (!K.FP.test(String(fp))) die('trust <sha256:16 hex>')
        const { g, p } = await fromRoot(await register())
        // which register answered: a refusal from yesterday's register reads differently from today's
        const site = await fetch(REGISTER + 'assets/version.js').then(r => r.text()).then(t => (t.match(/"(v[0-9.]+)"/) || [])[1] || '').catch(() => '')
        say(JSON.stringify({ ...D.trustFrom(g, fp, p.fp), register: `${REGISTER}directory/index.json${site ? ', site ' + site : ''}` }, null, 2))
    },
    async keyqr() {
        const id = await me(), k = M.keyCode(id.bundle)
        say(k.url); say(`fingerprint: ${id.bundle.signing_fingerprint} (read it to whoever scans this)`)
        await qrOut(flags['qr-link'] ? k.url : M.qrKey({ fp: id.bundle.signing_fingerprint, label: id.bundle.label, code: k.code }), flags.out)
    },
    async 'read-qr'() {
        if (!args.length) die('read-qr <image.png | batch.zip> […]')
        const list = await expand(args)
        if (list.length > 1 || list[0].bytes || list[0].error) {
            for (const e of list) { try { const q = e.bytes || e.error ? await entryOf(e) : await fromQrImage(e.src); say(JSON.stringify(q.kind === 'sealed' ? { item: e.name, kind: q.kind, to: q.to, from: q.from, bytes: q.code.length } : { item: e.name, kind: q.kind, fp: q.fp, label: q.label })) } catch (x) { say(JSON.stringify({ item: e.name, error: x.message })) } }
            return
        }
        const f = args[0]; if (!fs.existsSync(f)) die('read-qr <image.png>')
        const q = await fromQrImage(f)
        say(JSON.stringify(q.kind === 'sealed' ? { kind: q.kind, to: q.to, from: q.from, bytes: q.code.length } : { kind: q.kind, fp: q.fp, label: q.label, fingerprint_from_key: (await M.parseKeyCode(q.code)).signing_fingerprint }, null, 2))
    },
    async policy() {
        const f = args[0]; if (!f || !fs.existsSync(f)) die('policy <file>')
        say('sha256:' + await K.sha256hex(fs.readFileSync(f)))
    },
    async open() {
        if (!args.length) die('open <qr.png | batch.zip | qr.json | link | m1… | file.enc> […]')
        const list = await expand(args)
        if (list.length > 1) {                                  // a batch: each opened in turn, one JSON line each
            const seen = new Set()
            for (const e of list) {
                let got; try { got = e.bytes || e.error ? await entryOf(e) : await sourceOf(e.src) } catch (x) { say(JSON.stringify({ item: e.name, error: x.message })); continue }
                if (got.kind !== 'sealed') { say(JSON.stringify({ item: e.name, error: 'not a sealed message' })); continue }
                if (seen.has(got.code)) { say(JSON.stringify({ item: e.name, skipped: 'the same message again' })); continue }
                seen.add(got.code)
                const r = spawnSelf(['open', got.code, ...(flags.save ? ['--save', String(flags.save)] : [])])
                say(JSON.stringify({ item: e.name, ...(r.ok ? JSON.parse(r.out.slice(0, r.out.lastIndexOf('}') + 1)) : { error: r.err.trim() }) }))
            }
            return
        }
        const got = list[0].bytes ? await entryOf(list[0]).catch(e => die(e.message)) : await sourceOf(list[0].src)
        if (got.kind === 'key') die('that is a public key, not a sealed message: nothing to open')
        const enc = got.kind === 'sealed' ? M.parseCode(got.code).enc : got.enc
        const id = await me()
        let known = new Map(); try { known = new Map([...(await register()).byFp].map(([k, r]) => [k, r.bundle])) } catch (e) { /* offline: signatures unchecked */ }
        const o = await M.openMessage(enc, [id], known)
        let trust = 'no root pinned'
        if (o.msg.from && pinned()) { try { const reg = await register(), { g, p } = await fromRoot(reg), t = D.trustFrom(g, o.msg.from, p.fp); trust = t.ok ? `chains to the root: ${t.chain.join(' → ')}` : `NOT vouched for by the root: ${t.why}` } catch (e) { trust = 'not checked: ' + e.message } }
        // a vault key written into the text is never printed: it becomes a file like any other, saved with --save
        const vk = M.vaultKeysIn(o.msg.text), files = [...(o.msg.files || []), ...vk.keys.map(M.vaultKeyFile)]
        say(JSON.stringify({ from: o.msg.from || null, signature: o.verified === true ? 'checks' : o.verified === false ? 'DOES NOT CHECK' : 'not checked (sender not in the register)', sender_trust: trust, at: o.msg.at, expires: o.msg.expires || null, subject: o.msg.subject || '', text: vk.text, files: files.map(f => f.name), problems: o.problems,
            ...(vk.keys.length ? { note: `the text carried ${vk.keys.length === 1 ? 'a vault key' : vk.keys.length + ' vault keys'}: not printed, kept as ${vk.keys.map(k => `vault-key-${k.id}.txt`).join(', ')}${flags.save ? '' : ' (run again with --save <folder> to write it)'}` } : {}) }, null, 2))
        if (flags.save && files.length) for (const f of files) { const n = path.basename(String(f.name)).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^\.+/, '') || 'file'; writeSecret(path.join(String(flags.save), n), Buffer.from(K.unb64(f.data))); say(`saved ${path.join(String(flags.save), n)} (0600; its contents not shown)`) }
    },
    async keyfile() {
        const id = await me()
        if (!PASS) console.error('pki-agent: SG_SEND_PASSPHRASE is not set, so this keyfile is the private key in the clear')
        const priv = async der => PASS ? K.encryptPrivate(der, PASS) : K.pem(der, 'PRIVATE KEY')
        say(JSON.stringify({ v: 1, label: id.bundle.label, record: id.bundle.signing_fingerprint, created: id.created, private_key: await priv(id.private.encrypt), signing_private: await priv(id.private.sign) }))
    },
    async sign() {
        const f = args[0]; if (!f) die('sign <file>')
        const id = await me()
        fs.writeFileSync(f + '.sig', JSON.stringify({ signature: K.b64(await K.signBytes(id.private.sign, fs.readFileSync(f))), fingerprint: id.bundle.signing_fingerprint }, null, 2))
        say(`written: ${f}.sig`)
    },
}
if (!commands[cmd]) die(`unknown command ${cmd}: node pki-agent.mjs help`)
await commands[cmd]()
