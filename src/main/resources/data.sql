CREATE TABLE recipe (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    subrecipe BOOLEAN DEFAULT FALSE,
    people INT NOT NULL,
    instructions TEXT NULL,
    closing TEXT NULL,
    source_id BIGINT NULL,
    served TEXT NULL,
    page_ref VARCHAR(64) NULL,
    rating INT NULL,
    notes TEXT NULL,
    wine_tips TEXT null,
    match_for TEXT NULL,
    categories VARCHAR(255) NULL,
    CONSTRAINT unique_recipe_name UNIQUE (name)
);

CREATE TABLE ingredient (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    amount FLOAT NULL,
    preamble VARCHAR(255) NULL,
    measure VARCHAR(10) NULL,
    name VARCHAR(128) NOT NULL,
    prefix VARCHAR(255) NULL,
    instruction TEXT NULL,
    recipe_id BIGINT,
    sortorder INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_ingredient_recipe
        FOREIGN KEY (recipe_id)
            REFERENCES Recipe(id)
            ON DELETE CASCADE
);

CREATE TABLE attachment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_content TEXT NOT NULL,
    recipe_id BIGINT,
    FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
);

CREATE TABLE source (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(128),
     authors VARCHAR(255),
     info VARCHAR(255) NULL,
     title VARCHAR(255) NULL,
     CONSTRAINT unique_source_name UNIQUE (name)
);

CREATE TABLE recipe_subrecipe (
    recipe_id BIGINT,
    subrecipe_id BIGINT,
    subrecipe_order INT NOT NULL default 0,
    PRIMARY KEY (recipe_id, subrecipe_id),
    CONSTRAINT fk_recipe_subrecipe_recipe FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE,
    CONSTRAINT fk_recipe_subrecipe_subrecipe FOREIGN KEY (subrecipe_id) REFERENCES recipe(id) ON DELETE CASCADE
);

ALTER TABLE recipe ADD CONSTRAINT fk_source FOREIGN KEY (source_id) REFERENCES source(id);

CREATE TABLE conversion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    factor FLOAT NOT NULL,
    from_measure VARCHAR(10) NOT NULL,
    to_measure VARCHAR(10) NOT NULL,
    description TEXT NULL
);

CREATE TABLE temperatures (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    temp FLOAT NOT NULL,
    meat VARCHAR(255) NOT NULL,
    description TEXT NULL
);
