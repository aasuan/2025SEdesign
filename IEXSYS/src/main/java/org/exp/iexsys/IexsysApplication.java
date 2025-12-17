package org.exp.iexsys;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.mybatis.spring.annotation.MapperScan;

@SpringBootApplication
@MapperScan("org.exp.iexsys.mapper")
public class IexsysApplication {

    public static void main(String[] args) {
        SpringApplication.run(IexsysApplication.class, args);
    }

}
