# -*- coding: utf-8 -*-
"""
Gerador de "Especificação Técnica" no template Capgemini / Leroy Merlin (MOVE2S/4).

Reproduz o modelo lido em:
  LEROY_REL_INCLUIR MÓDULO_IDGAP_Template Especificação Técnica_DDMMAA_V02.docx

Uso como módulo (recomendado — para gerar a ficha de um GAP real):
    from build_gap_komatsu import build_gap_doc
    build_gap_doc("SAIDA.docx", {
        "id_gap": "GAP-0123",
        "descricao_gap": "Inclusão de módulo X no fluxo Y",
        "projeto_autor": "<nome informado pelo usuário>",
        "projeto_funcional": "Ciclano",
        "analista_ti": "Beltrano",
        "historico": [
            {"versao": "V0", "autor": "<mesmo nome>", "data": "01/01/26", "descricao": "Elaboração do documento"},
        ],
        "artefatos": {
            "responsavel": "<mesmo nome>",
            "data_criacao": "01.01.2026",
            "transacoes": "MB1B - Transferência entre depósitos",
            "objetos_tecnicos": "BADI: J_1BNF_ADD_DATA ...",
            "objetivo": "Descrição breve do objetivo",
            "tela_selecao": "(print da tela, se houver)",
            "itens": [
                {"objeto": "Tabela ZZZZ", "logica": "Armazenar os dados capturados ..."},
            ],
            "tvarv": "",
            "brf": "",
            "objeto_autorizacao": "",
        },
        "qualidade": {
            "inspecao": "Executar a transação SCI ... variante CODE_INSP_LEROY_GLOBAL",
            "criterio": "O resultado da inspeção não pode conter erros ...",
            "justificativas": "",
        },
        "teste_unitario_texto": "Texto real de evidência, se já tiver.",
    })

Convenção de cor herdada do modelo (confirmada campo a campo no .docx original):
  - Texto vermelho (FF0000) = ainda é placeholder / instrução "preencha isto".
  - Texto preto = rótulo fixo, ou valor já preenchido de verdade.
  Por isso: quando um campo não vem em `data`, o valor-padrão (igual ao do
  modelo) é escrito em vermelho; quando `data` traz um valor real, ele sai em
  preto — exatamente como um analista preenchendo o template à mão veria.

Uso direto (sem argumentos) — gera um demo com os MESMOS textos-placeholder do
modelo original, para comparação visual lado a lado com o .docx fonte.
"""
from __future__ import annotations

import itertools
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

HERE = Path(__file__).resolve().parent
MEDIA = HERE / "komatsu_media"
LOGO_CAPGEMINI = MEDIA / "header_image3.jpg"
LOGO_LEROY = MEDIA / "header_image4.png"

# --- paleta / medidas lidas do modelo original -----------------------------
SHADE_COVER_HEADER = "ECECEC"   # linha de título da tabela de capa
SHADE_LABEL_COL = "F2F2F2"      # coluna de rótulo nas tabelas de conteúdo
BORDER_SINGLE_SZ = "4"          # 0.5pt — tabela de capa
BORDER_OUTSET_SZ = "6"          # 0.75pt em relevo — tabelas de conteúdo
FONT_NAME = "Times New Roman"

RED_PLACEHOLDER = RGBColor(0xFF, 0x00, 0x00)   # "ainda precisa preencher"
GRAY_HINT = RGBColor(0xC0, 0xC0, 0xC0)         # dica itálica cinza (ex.: "Tela de seleção")

PAGE_W = Cm(21.0)
PAGE_H = Cm(29.7)
MARGIN_LR = Cm(1.9)
MARGIN_TOP = Cm(3.75)
MARGIN_BOTTOM = Cm(2.54)

# Posições/medidas exatas lidas no wp:anchor do header1.xml do
# modelo original (EMU). Os logos são flutuantes (behindDoc), não inline —
# por isso não dá pra posicionar só com tab stop.
CAPGEMINI_ANCHOR = dict(cx=1831340, cy=629920, pos_h=4551680, pos_v=-207010, behind_doc=True, wrap="through")
LEROY_ANCHOR = dict(cx=1038225, cy=751840, pos_h=-528955, pos_v=-357505, behind_doc=False, wrap="topbottom")

_shape_id_counter = itertools.count(251664384, 1024)


# ----------------------------------------------------------------------------
# Helpers de baixo nível (OOXML)
# ----------------------------------------------------------------------------
def shade_cell(cell, hex_color: str) -> None:
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def set_table_borders(table, style: str, sz: str, color: str = "auto") -> None:
    """style: 'single' (tabela de capa) ou 'outset' (tabelas de conteúdo)."""
    tbl = table._tbl
    tblPr = tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), style)
        el.set(qn("w:sz"), sz)
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        borders.append(el)
    tblPr.append(borders)


def set_run(run, text: str, *, size=11, bold=False, italic=False, color=None, name=FONT_NAME) -> None:
    run.text = text
    run.bold = bold
    run.italic = italic
    run.font.size = Pt(size)
    run.font.name = name
    if color is not None:
        run.font.color.rgb = color


def write_multiline(cell, text: str, *, size=10, bold=False, italic=False, color=None, name=FONT_NAME) -> None:
    """Um parágrafo por linha. `\\n` dentro de `run.text` não quebra linha no Word."""
    lines = (text or "").split("\n") or [""]
    for i, line in enumerate(lines):
        p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
        set_run(p.add_run(), line, size=size, bold=bold, italic=italic, color=color, name=name)


def set_col_widths(table, widths_cm: list[float]) -> None:
    table.autofit = False
    for row in table.rows:
        for cell, w in zip(row.cells, widths_cm):
            cell.width = Cm(w)
    for col, w in zip(table.columns, widths_cm):
        col.width = Cm(w)


def merge_row(table, ri: int, ranges: list[tuple[int, int]]):
    """Mescla um conjunto de faixas de colunas na linha ri e devolve as células
    resultantes (uma por faixa), na mesma ordem de `ranges`. Sem isso, texto
    repetido em colunas estreitas não-mescladas quebra letra a letra no Word."""
    row = table.rows[ri]
    cells = []
    for start, end in ranges:
        cell = row.cells[start]
        if end > start:
            cell = cell.merge(row.cells[end])
        cells.append(cell)
    return cells


def set_outline_level(paragraph, level: int) -> None:
    """Define o nível de tópico (w:outlineLvl) direto no parágrafo — é o que o
    campo TOC \\o "1-3" usa para achar as entradas do sumário, independente do
    nome do estilo aplicado (o modelo original usa 'List Paragraph', não os
    estilos nativos 'Heading 1..3')."""
    pPr = paragraph._p.get_or_add_pPr()
    outline = OxmlElement("w:outlineLvl")
    outline.set(qn("w:val"), str(level))
    pPr.append(outline)


def resolve(data: dict, key: str, default: str) -> tuple[str, bool]:
    """Devolve (texto, é_placeholder). `é_placeholder=True` quando o chamador
    não informou valor real — nesse caso o texto (igual ao do modelo) deve
    sair em vermelho, seguindo a convenção do documento original."""
    val = data.get(key)
    if val:
        return val, False
    return default, True


def add_floating_picture(
    paragraph,
    image_path: Path,
    *,
    cx: int,
    cy: int,
    pos_h: int,
    pos_v: int,
    pos_h_rel: str = "column",
    pos_v_rel: str = "paragraph",
    behind_doc: bool = False,
    wrap: str = "square",
    name: str = "Imagem",
):
    """Insere uma imagem flutuante (wp:anchor), replicando exatamente como o
    modelo original posiciona os logos de cabeçalho/rodapé. O python-docx só
    tem API de alto nível para imagem inline (`run.add_picture`); imagem
    ancorada/flutuante precisa ser montada manualmente em OOXML."""
    if not image_path.exists():
        return None
    part = paragraph.part
    rId, _image = part.get_or_add_image(str(image_path))

    run = paragraph.add_run()
    drawing = OxmlElement("w:drawing")
    anchor = OxmlElement("wp:anchor")
    for attr, val in {
        "distT": "0", "distB": "0", "distL": "114300", "distR": "114300",
        "simplePos": "0", "relativeHeight": str(next(_shape_id_counter)),
        "behindDoc": "1" if behind_doc else "0", "locked": "0",
        "layoutInCell": "1", "allowOverlap": "1",
    }.items():
        anchor.set(attr, val)

    simple_pos = OxmlElement("wp:simplePos")
    simple_pos.set("x", "0")
    simple_pos.set("y", "0")

    pos_h_el = OxmlElement("wp:positionH")
    pos_h_el.set("relativeFrom", pos_h_rel)
    off_h = OxmlElement("wp:posOffset")
    off_h.text = str(pos_h)
    pos_h_el.append(off_h)

    pos_v_el = OxmlElement("wp:positionV")
    pos_v_el.set("relativeFrom", pos_v_rel)
    off_v = OxmlElement("wp:posOffset")
    off_v.text = str(pos_v)
    pos_v_el.append(off_v)

    extent = OxmlElement("wp:extent")
    extent.set("cx", str(cx))
    extent.set("cy", str(cy))

    effect_extent = OxmlElement("wp:effectExtent")
    for a in ("l", "t", "r", "b"):
        effect_extent.set(a, "0")

    wrap_tag = {
        "square": "wp:wrapSquare",
        "through": "wp:wrapThrough",
        "topbottom": "wp:wrapTopAndBottom",
    }.get(wrap, "wp:wrapNone")
    wrap_el = OxmlElement(wrap_tag)
    if wrap in ("square", "through"):
        wrap_el.set("wrapText", "bothSides")
    if wrap == "through":
        # CT_WrapThrough exige um wrapPolygon (Word recusa abrir o arquivo
        # sem isso — não é só um "reparar", é erro fatal de abertura).
        # Retângulo fechado cobrindo 100% da imagem (espaço 0..21600).
        wrap_polygon = OxmlElement("wp:wrapPolygon")
        wrap_polygon.set("edited", "0")
        start = OxmlElement("wp:start")
        start.set("x", "0")
        start.set("y", "0")
        wrap_polygon.append(start)
        for x, y in ((0, 21600), (21600, 21600), (21600, 0), (0, 0)):
            line_to = OxmlElement("wp:lineTo")
            line_to.set("x", str(x))
            line_to.set("y", str(y))
            wrap_polygon.append(line_to)
        wrap_el.append(wrap_polygon)

    doc_pr = OxmlElement("wp:docPr")
    doc_pr.set("id", str(next(_shape_id_counter) % 100000))
    doc_pr.set("name", name)

    frame_locks = OxmlElement("wp:cNvGraphicFramePr")

    graphic = OxmlElement("a:graphic")
    graphic_data = OxmlElement("a:graphicData")
    graphic_data.set("uri", "http://schemas.openxmlformats.org/drawingml/2006/picture")

    pic = OxmlElement("pic:pic")
    nv_pic_pr = OxmlElement("pic:nvPicPr")
    c_nv_pr = OxmlElement("pic:cNvPr")
    c_nv_pr.set("id", "0")
    c_nv_pr.set("name", name)
    c_nv_pic_pr = OxmlElement("pic:cNvPicPr")
    nv_pic_pr.append(c_nv_pr)
    nv_pic_pr.append(c_nv_pic_pr)

    blip_fill = OxmlElement("pic:blipFill")
    blip = OxmlElement("a:blip")
    blip.set(qn("r:embed"), rId)
    stretch = OxmlElement("a:stretch")
    stretch.append(OxmlElement("a:fillRect"))
    blip_fill.append(blip)
    blip_fill.append(stretch)

    sp_pr = OxmlElement("pic:spPr")
    xfrm = OxmlElement("a:xfrm")
    off = OxmlElement("a:off")
    off.set("x", "0")
    off.set("y", "0")
    ext2 = OxmlElement("a:ext")
    ext2.set("cx", str(cx))
    ext2.set("cy", str(cy))
    xfrm.append(off)
    xfrm.append(ext2)
    prst_geom = OxmlElement("a:prstGeom")
    prst_geom.set("prst", "rect")
    prst_geom.append(OxmlElement("a:avLst"))
    sp_pr.append(xfrm)
    sp_pr.append(prst_geom)
    sp_pr.append(OxmlElement("a:noFill"))

    pic.append(nv_pic_pr)
    pic.append(blip_fill)
    pic.append(sp_pr)
    graphic_data.append(pic)
    graphic.append(graphic_data)

    for el in (simple_pos, pos_h_el, pos_v_el, extent, effect_extent, wrap_el, doc_pr, frame_locks, graphic):
        anchor.append(el)
    drawing.append(anchor)
    run._r.append(drawing)
    return run


# ----------------------------------------------------------------------------
# Cabeçalho / página
# ----------------------------------------------------------------------------
def setup_page_and_header_footer(doc: Document) -> None:
    sec = doc.sections[0]
    sec.page_width = PAGE_W
    sec.page_height = PAGE_H
    sec.left_margin = MARGIN_LR
    sec.right_margin = MARGIN_LR
    sec.top_margin = MARGIN_TOP
    sec.bottom_margin = MARGIN_BOTTOM

    # Cabeçalho: os dois logos são flutuantes (behindDoc), com posição
    # absoluta em relação à coluna/parágrafo — Leroy Merlin fica à ESQUERDA
    # (offset negativo, quase saindo da margem) e Capgemini à DIREITA
    # (offset positivo, ~12,6cm). Confirmado direto no wp:anchor do original
    # — a ordem visual NÃO é dada pela ordem dos runs nem por tab stop.
    hdr_p = sec.header.paragraphs[0]
    add_floating_picture(hdr_p, LOGO_CAPGEMINI, name="Logo Capgemini", **CAPGEMINI_ANCHOR)
    add_floating_picture(hdr_p, LOGO_LEROY, name="Logo Leroy Merlin", **LEROY_ANCHOR)


def add_toc_field(doc: Document) -> None:
    """Insere o campo de Sumário automático (TOC \\o \"1-3\" \\h \\z \\u) —
    o Word pede para 'Atualizar campo' na primeira abertura, como no modelo."""
    p = doc.add_paragraph()
    run = p.add_run()
    fld_char_begin = OxmlElement("w:fldChar")
    fld_char_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = 'TOC \\o "1-3" \\h \\z \\u'
    fld_char_sep = OxmlElement("w:fldChar")
    fld_char_sep.set(qn("w:fldCharType"), "separate")
    fld_text = OxmlElement("w:t")
    fld_text.text = "Clique aqui e pressione F9 para atualizar o sumário."
    fld_char_end = OxmlElement("w:fldChar")
    fld_char_end.set(qn("w:fldCharType"), "end")

    r_element = run._r
    r_element.append(fld_char_begin)
    r_element.append(instr)
    r_element.append(fld_char_sep)
    r_element.append(fld_text)
    r_element.append(fld_char_end)


# ----------------------------------------------------------------------------
# Tabela de capa (título + metadados + histórico de revisão)
# ----------------------------------------------------------------------------
def add_cover(doc: Document, data: dict) -> None:
    # No modelo original o título fica sozinho na página 1 (cover), separado
    # da tabela de metadados por um `w:br type="page"` explícito — não é só
    # texto grande, tem parágrafos em branco antes/depois (contados direto no
    # body do .docx original) + uma quebra de página de verdade.
    for _ in range(10):
        doc.add_paragraph()

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run(title.add_run(), "Especificação Técnica", size=28, bold=True)

    for _ in range(4):
        doc.add_paragraph()

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run(sub.add_run(), "Projeto MOVE2S/4", size=14, bold=True)

    for _ in range(3):
        doc.add_paragraph()
    doc.add_page_break()
    doc.add_paragraph()

    tbl = doc.add_table(rows=9, cols=6)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl, "single", BORDER_SINGLE_SZ)
    # Larguras medidas direto no wp:tblGrid do modelo original (cm).
    set_col_widths(tbl, [1.50, 2.74, 2.76, 2.00, 0.75, 8.25])

    def fill_title_cells(cells, texts, *, shade=None):
        for cell, txt in zip(cells, texts):
            set_run(cell.paragraphs[0].add_run(), txt, size=11, bold=True)
            if shade:
                shade_cell(cell, shade)

    def fill_label_value(cell, label: str, value_key: str | None, default: str, *, data=None):
        """Rótulo em negrito preto + valor: vermelho se ainda for o
        placeholder do modelo, preto se `data` trouxe um valor real —
        replica os dois runs (label / valor) do documento original."""
        p = cell.paragraphs[0]
        set_run(p.add_run(), label, size=11, bold=True)
        if value_key is None:
            return
        value, is_placeholder = resolve(data or {}, value_key, default)
        set_run(p.add_run(" "), " ", size=11)
        set_run(p.add_run(), value, size=11, color=RED_PLACEHOLDER if is_placeholder else None)

    # Linha 0: título, uma única célula mesclada 0-5.
    fill_title_cells(merge_row(tbl, 0, [(0, 5)]), ["Especificação Técnica"], shade=SHADE_COVER_HEADER)

    # Linha 1: "Projeto" mescla 0-3 (valor fixo, sempre preto), "Autor" mescla 4-5.
    c_proj, c_autor = merge_row(tbl, 1, [(0, 3), (4, 5)])
    fill_label_value(c_proj, "Projeto:", None, "")
    set_run(c_proj.paragraphs[0].add_run(" "), " ", size=11)
    set_run(c_proj.paragraphs[0].add_run(), data.get("projeto", "MOVE2S/4 (Leroy Merlin)"), size=11)
    fill_label_value(c_autor, "Autor:", "projeto_autor", "<Informar Nome do Consultor Técnico>", data=data)

    # Linha 2: "Funcional" mescla 0-3, "Analista TI" mescla 4-5.
    c_func, c_analista = merge_row(tbl, 2, [(0, 3), (4, 5)])
    fill_label_value(c_func, "Funcional:", "projeto_funcional", "<Informar Nome do Consultor Funcional>", data=data)
    fill_label_value(c_analista, "Analista TI:", "analista_ti", "<Informar Nome do Analista TI>", data=data)

    # Linha 3: "ID GAP" mescla 0-1, "Descrição GAP" mescla 2-5.
    c_idgap, c_descgap = merge_row(tbl, 3, [(0, 1), (2, 5)])
    fill_label_value(c_idgap, "ID GAP:", "id_gap", "<IDGAP>", data=data)
    fill_label_value(c_descgap, "Descrição GAP:", "descricao_gap", "<Informar Descrição do GAP>", data=data)

    # Linha 4: em branco, 6 células separadas — sem mescla no original.
    for cell in tbl.rows[4].cells:
        set_run(cell.paragraphs[0].add_run(), "", size=11)

    # Linha 5: "Histórico de Revisão", mescla 0-5.
    fill_title_cells(merge_row(tbl, 5, [(0, 5)]), ["Histórico de Revisão"], shade=SHADE_COVER_HEADER)

    # Linha 6: cabeçalho da subtabela — "Autor" mescla 1-2, "Data" mescla 3-4.
    for cell, txt in zip(
        merge_row(tbl, 6, [(0, 0), (1, 2), (3, 4), (5, 5)]),
        ["Versão", "Autor", "Data", "Descrição da Revisão"],
    ):
        set_run(cell.paragraphs[0].add_run(), txt, size=11, bold=True)

    historico = data.get("historico") or [
        {"versao": "V0", "descricao": "Elaboração do documento"},
        {"versao": "V1", "descricao": None},
    ]
    for idx, rev in enumerate(historico[:2]):
        c_ver, c_autor_h, c_data_h, c_desc_h = merge_row(tbl, 7 + idx, [(0, 0), (1, 2), (3, 4), (5, 5)])
        set_run(c_ver.paragraphs[0].add_run(), rev.get("versao", f"V{idx}"), size=11)
        autor_h, autor_ph = resolve(rev, "autor", "<Informar Nome do Consultor>")
        set_run(c_autor_h.paragraphs[0].add_run(), autor_h, size=11, color=RED_PLACEHOLDER if autor_ph else None)
        data_h, data_ph = resolve(rev, "data", "DD/MM/AA")
        set_run(c_data_h.paragraphs[0].add_run(), data_h, size=11, color=RED_PLACEHOLDER if data_ph else None)
        default_desc = "Elaboração do documento" if idx == 0 else "<Informar o que foi modificado>"
        desc_h, desc_ph = resolve(rev, "descricao", default_desc)
        set_run(c_desc_h.paragraphs[0].add_run(), desc_h, size=11, color=RED_PLACEHOLDER if desc_ph else None)

    doc.add_paragraph()
    h = doc.add_paragraph()
    set_run(h.add_run(), "SUMÁRIO", size=12, bold=True)
    add_toc_field(doc)
    doc.add_page_break()


# ----------------------------------------------------------------------------
# Seções de conteúdo (rótulo/valor, coluna de rótulo sombreada)
# ----------------------------------------------------------------------------
def add_section_heading(doc: Document, numero: int, titulo: str) -> None:
    p = doc.add_paragraph(style="List Paragraph")
    set_run(p.add_run(), f"{numero}.\t{titulo}", size=14, bold=True)
    # Nível de tópico 0 (= "Nível 1" no Word) — é isso que o campo
    # TOC \o "1-3" usa para achar a entrada, não o nome do estilo.
    set_outline_level(p, 0)


def add_label_value_table(
    doc: Document,
    rows: list[tuple[str, str, bool]],
    *,
    col_widths=(6.5, 10.2),
    hint: tuple[int, str] | None = None,
) -> None:
    """rows: (rótulo, valor, é_placeholder). `hint`: (índice_da_linha, texto)
    para o comentário itálico cinza colado no rótulo (ex.: Tela de seleção)."""
    tbl = doc.add_table(rows=len(rows), cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl, "outset", BORDER_OUTSET_SZ)
    set_col_widths(tbl, list(col_widths))
    for ri, (label, value, is_placeholder) in enumerate(rows):
        lc, vc = tbl.rows[ri].cells
        lp = lc.paragraphs[0]
        set_run(lp.add_run(), label, size=10)
        if hint and hint[0] == ri:
            set_run(lp.add_run(" "), " ", size=10)
            set_run(lp.add_run(), hint[1], size=10, italic=True, color=GRAY_HINT)
        shade_cell(lc, SHADE_LABEL_COL)
        write_multiline(vc, value, size=10, color=RED_PLACEHOLDER if is_placeholder else None)
    doc.add_paragraph()


def add_artefatos_tecnicos(doc: Document, art: dict) -> None:
    add_section_heading(doc, 1, "Artefatos Técnicos")
    itens = art.get("itens")
    is_default_itens = not itens
    if is_default_itens:
        itens = [{"objeto": "<OBJETO>\nEx.: Tabela ZZZZ",
                   "logica": "<descrever de forma suscinta, porém clara, a lógica do desenvolvimento>\n"
                             "Ex.: Armazenar os dados capturados no coletor da entrada física realizada no HJS"}]

    def r(key, default):
        val, is_ph = resolve(art, key, default)
        return val, is_ph

    rows = []
    rows.append(("Responsável:", *r("responsavel", "<Nome>")))
    rows.append(("Data da criação:", *r("data_criacao", "DD.MM.YYYY")))
    rows.append(("Transações envolvidas", *r("transacoes",
        "<TCODE> - <Descrição breve do uso>\nEx.: MBST – Cancelamento do documento "
        "movimento de estoque na entrada da nota")))
    rows.append(("Objetos técnicos envolvidos", *r("objetos_tecnicos",
        "<Tipo de objeto> - <Nome técnico>\nEx: BADI: J_1BNF_ADD_DATA")))
    rows.append(("Objetivo do desenvolvimento", *r("objetivo", "<Descrição breve>")))
    tela_key_idx = len(rows)
    rows.append(("Tela de seleção", *r("tela_selecao", "<print da tela desenvolvida, se houver>")))
    for item in itens:
        objeto = item.get("objeto", "<OBJETO>")
        logica, logica_ph = resolve(item, "logica", "")
        rows.append((objeto, logica, logica_ph if not is_default_itens else True))
    rows.append(("TVARV", *r("tvarv", "")))
    rows.append(("BRF +", *r("brf", "")))
    rows.append(("Objeto de Autorização", *r("objeto_autorizacao", "")))

    add_label_value_table(
        doc, rows,
        hint=(tela_key_idx, "(Se houver tratamento específico para algum campo, detalhes aqui)"),
    )


def add_evidencia_qualidade(doc: Document, qlt: dict) -> None:
    add_section_heading(doc, 2, "Evidência de Qualidade")
    # No modelo original este bloco é instrução de processo fixa, sempre em
    # preto (não é "placeholder vermelho") — só a linha de justificativa,
    # quando vazia, some (fica em branco, sem cor).
    rows = [
        (qlt.get("inspecao",
            "Executar a transação SCI para validação do código pelo objeto ou por request. "
            "Selecionar sempre a variante: CODE_INSP_LEROY_GLOBAL"), "Criar a inspeção", False),
        (qlt.get("criterio",
            "O Resultado da inspeção não pode conter erros, podem conter advertências. Em caso de "
            "erros que não podem ser ajustados (ex.: Classe Proxy, Geração de Código Standard), "
            "isso pode ser justificado."),
         "Resultado da validação dos objetos dos desenvolvimentos.", False),
        ("Justificativas.", qlt.get("justificativas", ""), False),
    ]
    add_label_value_table(doc, rows)


def add_teste_unitario(doc: Document, texto: str | None) -> None:
    add_section_heading(doc, 3, "Evidência de Teste Unitário")
    is_placeholder = not texto
    conteudo = texto or (
        "< Apresentar os prints de telas com as evidências, na sequência lógica de testes. "
        "Ex: prints da SXI_MONITOR, app no FLP, payloads, documento gerado/documen.>\n"
        "< OBRIGATÓRIO os prints de telas, conforme o \u201cTeste Esperado do Especificação "
        "Funcional\u201d, para comprovar a garantia da Entrega do GAP, valide com o funcional "
        "os dados de testes para completar esse item importante, caso tenha algum problema no teste >"
    )
    color = RED_PLACEHOLDER if is_placeholder else None
    for line in conteudo.split("\n"):
        p = doc.add_paragraph()
        set_run(p.add_run(), line, size=10, color=color)


def _update_fields_via_word(path: str) -> None:
    """Abre o .docx no Word instalado, recalcula os campos (TOC/PAGE) e
    resalva — sem isso o SUMÁRIO só aparece populado depois que o usuário
    abre o arquivo e aperta F9 manualmente. Silenciosamente ignorado se não
    houver Word/pywin32 disponíveis (ex.: gerando fora do Windows)."""
    import win32com.client as win32  # import local: dependência opcional

    abs_path = str(Path(path).resolve())
    word = win32.gencache.EnsureDispatch("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0
    try:
        doc = word.Documents.Open(abs_path, ConfirmConversions=False, AddToRecentFiles=False)
        try:
            doc.Fields.Update()
            for section in doc.Sections:
                for hf in (section.Headers, section.Footers):
                    for i in range(1, hf.Count + 1):
                        hf(i).Range.Fields.Update()
            doc.Save()
        finally:
            doc.Close(False)
    finally:
        word.Quit()


# ----------------------------------------------------------------------------
# Entrada principal
# ----------------------------------------------------------------------------
def build_gap_doc(output_path: str, data: dict) -> str:
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = FONT_NAME
    style.font.size = Pt(11)

    setup_page_and_header_footer(doc)
    add_cover(doc, data)
    add_artefatos_tecnicos(doc, data.get("artefatos", {}))
    add_evidencia_qualidade(doc, data.get("qualidade", {}))
    add_teste_unitario(doc, data.get("teste_unitario_texto"))

    doc.save(output_path)

    try:
        _update_fields_via_word(output_path)
    except Exception as exc:  # sem Word/pywin32: segue sem sumário pré-calculado
        print(f"[aviso] não foi possível pré-calcular TOC/PAGE via Word ({exc}); "
              f"o SUMÁRIO vai aparecer só depois que o usuário apertar F9 no Word.")

    return output_path


if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Gera a Especificação Técnica Leroy Merlin (MOVE2S/4).")
    parser.add_argument("--data", required=True, help="JSON UTF-8 com os campos do GAP")
    parser.add_argument("--out", required=True, help="Caminho do .docx de saída")
    args = parser.parse_args()
    data = json.loads(Path(args.data).read_text(encoding="utf-8"))
    print(build_gap_doc(args.out, data))
