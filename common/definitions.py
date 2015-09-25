from collections import OrderedDict

AMINO_ACIDS = OrderedDict([
        ('A', 'Ala'),
        ('C', 'Cys'),
        ('D', 'Asp'),
        ('E', 'Glu'),
        ('F', 'Phe'),
        ('G', 'Gly'),
        ('H', 'His'),
        ('I', 'Ile'),
        ('K', 'Lys'),
        ('L', 'Leu'),
        ('M', 'Met'),
        ('N', 'Asn'),
        ('P', 'Pro'),
        ('Q', 'Gln'),
        ('R', 'Arg'),
        ('S', 'Ser'),
        ('T', 'Thr'),
        ('V', 'Val'),
        ('W', 'Trp'),
        ('Y', 'Tyr'),
        ('X', 'Xaa'),
    ])

AMINO_ACID_GROUPS = OrderedDict([
        ('hp',     ('A', 'C', 'F', 'I', 'L', 'M', 'P', 'V', 'W', 'Y')),
        ('alhp',   ('A', 'C', 'I', 'L', 'M', 'P', 'V')),
        ('arhp',   ('F', 'W', 'Y')),
        ('ar',     ('F', 'H', 'W', 'Y')),
        ('pol',    ('D', 'E', 'H', 'K', 'N', 'Q', 'R', 'S', 'T')),
        ('hbd',    ('H', 'K', 'N', 'Q', 'R', 'S', 'T', 'W', 'Y')),
        ('hbd',    ('H', 'K', 'N', 'Q', 'R', 'S', 'T', 'W', 'Y')),
        ('hba',    ('D', 'E', 'H', 'N', 'Q', 'S', 'T', 'Y')),
        ('neg',    ('D', 'E')),
        ('pos',    ('H', 'K', 'R')),
        ('lar',    ('E', 'F', 'H', 'K', 'Q', 'R', 'W', 'Y')),
        ('sma',    ('A', 'C', 'D', 'G', 'N', 'P', 'S', 'T', 'V')),
        ('any',    ()),
        ('custom', ()),
    ])

AMINO_ACID_GROUP_NAMES = OrderedDict([
        ('hp',     'Hydrophobic - All'),
        ('alhp',   'Hydrophobic - Aliphatic'),
        ('arhp',   'Hydrophobic - Aromatic'),
        ('ar',     'Aromatic'),
        ('pol',    'Polar'),
        ('hbd',    'H-Bond Donor'),
        ('hba',    'H-Bond Acceptor'),
        ('neg',    'Negative charge'),
        ('pos',    'Positive charge'),
        ('lar',    'Large'),
        ('sma',    'Small'),
        ('any',    'Any feature'),
        ('custom', 'Custom'),
    ])